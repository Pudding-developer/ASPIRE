"""
interventions_service.py — Standalone Skill Interventions generator.

Independent of the 7-agent CrewAI pipeline. Aggregates the student's per-ILO
scores, retrieves curriculum chunks via pgvector, calls Gemini once via LiteLLM
with the bundled context, and persists the parsed intervention list.

Triggered manually (POST /api/student/interventions/{id}) or automatically as
a FastAPI BackgroundTask whenever an instructor submits new scores.
"""
import json
import re
from collections import defaultdict
from datetime import datetime
from typing import Any

import litellm
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.ai.embeddings import embed_query
from app.core.config import DATABASE_URL, GEMINI_MODEL
from app.models.class_model import (
    Class, Assessment, AssessmentILO, StudentScore,
)
from app.models.student_interventions import StudentInterventions


# Sync pgvector engine (same pattern as RagCareerTool — LiteLLM call is async,
# but pgvector cosine search runs in a worker thread so a sync engine is fine)
_sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
_sync_engine = create_engine(_sync_url, pool_pre_ping=True)


SEVERITY_AT_RISK = "at_risk"
SEVERITY_NEEDS_IMPROVEMENT = "needs_improvement"
SEVERITY_PREPARATORY = "preparatory"
VALID_SEVERITIES = {SEVERITY_AT_RISK, SEVERITY_NEEDS_IMPROVEMENT, SEVERITY_PREPARATORY}

REQUIRED_KEYS = {
    "ilo_statement", "subject_code", "subject_name", "ilo_number",
    "current_score", "severity", "advice", "affected_subjects",
}


# ── Score aggregation ───────────────────────────────────────────────────────

async def _aggregate_scores(db: AsyncSession, student_id: int) -> list[dict]:
    """
    Pull the student's StudentScore rows joined to AssessmentILO + Class,
    then average the percentage per (subject, ilo_number).

    Returns: [{course_code, subject_name, ilo_scores: {1: 64.5, ...}}, ...]
    """
    result = await db.execute(
        select(StudentScore, AssessmentILO, Class)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .join(Class, Assessment.class_id == Class.id)
        .where(StudentScore.student_id == student_id)
    )
    rows = result.all()
    if not rows:
        return []

    # bucket: (course_code, subject_name) -> ilo_number -> [pct]
    bucket: dict[tuple[str, str], dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
    for score, ilo, cls in rows:
        if ilo.max_score <= 0:
            continue
        pct = (score.score / ilo.max_score) * 100
        bucket[(cls.course_code, cls.subject_name)][ilo.ilo_number].append(pct)

    courses = []
    for (code, name), ilos in bucket.items():
        averaged = {n: round(sum(v) / len(v), 1) for n, v in ilos.items()}
        courses.append({
            "course_code": code,
            "subject_name": name,
            "ilo_scores": averaged,
        })
    return courses


# ── pgvector retrieval ──────────────────────────────────────────────────────

def _query_curriculum(query_text: str, top_k: int = 3) -> list[dict]:
    """
    Run cosine similarity search against knowledge_chunks (curriculum category).
    Returns a list of {title, content, similarity}.
    """
    try:
        vec = embed_query(query_text)
    except Exception as exc:
        print(f"[interventions] embed_query failed: {exc}")
        return []

    sql = text("""
        SELECT title, content,
               1 - (embedding <=> CAST(:vec AS vector)) AS similarity
        FROM knowledge_chunks
        WHERE embedding IS NOT NULL AND category = 'curriculum'
        ORDER BY embedding <=> CAST(:vec AS vector)
        LIMIT :k
    """)
    try:
        with _sync_engine.connect() as conn:
            rows = conn.execute(sql, {"vec": str(vec), "k": top_k}).fetchall()
    except Exception as exc:
        print(f"[interventions] pgvector query failed: {exc}")
        return []

    return [
        {"title": r.title, "content": r.content, "similarity": round(float(r.similarity), 4)}
        for r in rows
    ]


def _build_rag_context(courses: list[dict]) -> str:
    """
    For each enrolled course, retrieve its curriculum chunk plus a couple
    semantically-adjacent chunks (used by the LLM to identify downstream subjects).
    Returns a single string block ready to inject into the prompt.
    """
    seen_titles: set[str] = set()
    blocks: list[str] = []
    for course in courses:
        code = course["course_code"]
        name = course["subject_name"]
        # Primary query: this subject's own curriculum chunk
        primary = _query_curriculum(
            f"{code} {name} learning outcomes ILO topics", top_k=2
        )
        # Secondary query: surface candidate downstream / related subjects
        related = _query_curriculum(
            f"subjects that build on {name} prerequisite {code}", top_k=3
        )
        for chunk in primary + related:
            if chunk["title"] in seen_titles:
                continue
            seen_titles.add(chunk["title"])
            blocks.append(f"=== {chunk['title']} ===\n{chunk['content']}")
    return "\n\n".join(blocks) if blocks else "(no curriculum context retrieved)"


# ── Prompt + LLM call ───────────────────────────────────────────────────────

_SYSTEM_PROMPT = (
    "You are a study advisor for BSU Bachelor of Science in Computer Engineering "
    "(BSCpE) students. Generate personalized intervention cards from a student's "
    "per-ILO assessment scores and the curriculum context provided. "
    "You return ONLY a single JSON object — no commentary, no markdown fences."
)


def _build_user_prompt(courses: list[dict], rag_context: str) -> str:
    score_lines = []
    for c in courses:
        score_lines.append(f"\n[{c['course_code']}] {c['subject_name']}:")
        for ilo_num in sorted(c["ilo_scores"]):
            score_lines.append(f"  ILO {ilo_num}: {c['ilo_scores'][ilo_num]}%")
    score_block = "\n".join(score_lines)

    return f"""Student per-ILO scores (averaged across all submitted assessments):
{score_block}

Curriculum context retrieved from the BSCpE knowledge base:

{rag_context}

INSTRUCTIONS:
For EVERY (course, ILO) pair above:

1. Classify by score:
   - score < 60        → severity = "at_risk"            (REMEDIAL)
   - 60 ≤ score < 75   → severity = "needs_improvement"  (REMEDIAL)
   - score ≥ 75        → severity = "preparatory"        (ONLY if downstream subjects exist in BSCpE)

2. For REMEDIAL interventions (at_risk / needs_improvement):
   - ilo_statement: copy the EXACT ILO statement text from the curriculum chunk above. Do NOT paraphrase to "Learning outcome N for X".
   - advice: tell the student what specific topics from THIS subject to drill. Reference concrete topics from the chunk (e.g., "limits, continuity, chain rule, related rates").
   - affected_subjects: list later BSCpE subjects whose mastery depends on this one. Use the curriculum context above + your knowledge of CpE program flow to identify them. Each item: {{ "code", "name", "reason" }}. The reason explains WHY mastery here matters there (e.g., "Integration techniques in MATH 402 build directly on differentiation mastery").

3. For PREPARATORY interventions (preparatory):
   - ONLY emit if at least one downstream subject exists. Otherwise skip — do NOT emit a card.
   - ilo_statement: copy the EXACT ILO statement.
   - advice: tell the student what to start previewing from the NEXT (downstream) subject. Reference concrete topics from THAT downstream subject. Mention the subject by code+name.
   - affected_subjects: at most 2 downstream subjects with reasons.

4. Use ONLY the BSCpE subject codes you can see in the curriculum context. Do not invent subjects.

OUTPUT — return ONLY this JSON object (no markdown, no prose):
{{"interventions": [
  {{
    "ilo_statement": "Demonstrate knowledge of fundamental concepts in algebra, trigonometry, and analytic geometry to model real-world problems.",
    "subject_code": "MATH 401",
    "subject_name": "Differential Calculus",
    "ilo_number": 1,
    "current_score": 64.0,
    "severity": "needs_improvement",
    "advice": "Drill algebra, trig identities, and analytic geometry — these underpin every later calculus topic. Rework problems on factoring, the unit circle, and conic sections until they are automatic.",
    "affected_subjects": [
      {{ "code": "MATH 402", "name": "Integral Calculus", "reason": "Integration techniques build on the algebraic and trigonometric fluency developed here." }}
    ]
  }}
]}}"""


async def _call_llm(courses: list[dict], rag_context: str) -> str:
    """One async LiteLLM call. Returns the raw model response text."""
    response = await litellm.acompletion(
        model=GEMINI_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(courses, rag_context)},
        ],
        timeout=120,
        max_retries=3,
    )
    return response.choices[0].message.content or ""


# ── Response parsing + validation ───────────────────────────────────────────

def _extract_json(raw: str) -> dict:
    """Strip code fences and parse JSON. Falls back to first {...} block."""
    cleaned = raw.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```", 1)[1].split("```", 1)[0]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    raise ValueError("Gemini response did not contain valid JSON.")


def _validate_intervention(item: Any) -> dict | None:
    """Return a normalized intervention dict, or None if invalid."""
    if not isinstance(item, dict):
        return None
    if not REQUIRED_KEYS.issubset(item.keys()):
        return None
    if item.get("severity") not in VALID_SEVERITIES:
        return None
    try:
        score = float(item["current_score"])
        ilo_num = int(item["ilo_number"])
    except (TypeError, ValueError):
        return None

    affected = []
    for sub in item.get("affected_subjects") or []:
        if not isinstance(sub, dict):
            continue
        if "code" in sub and "name" in sub and "reason" in sub:
            affected.append({
                "code": str(sub["code"]).strip(),
                "name": str(sub["name"]).strip(),
                "reason": str(sub["reason"]).strip(),
            })

    # preparatory cards require at least one downstream subject
    if item["severity"] == SEVERITY_PREPARATORY and not affected:
        return None

    return {
        "ilo_statement": str(item["ilo_statement"]).strip(),
        "subject_code": str(item["subject_code"]).strip(),
        "subject_name": str(item["subject_name"]).strip(),
        "ilo_number": ilo_num,
        "current_score": round(score, 1),
        "severity": item["severity"],
        "advice": str(item["advice"]).strip(),
        "affected_subjects": affected,
    }


def _parse_interventions(raw: str) -> list[dict]:
    data = _extract_json(raw)
    items = data.get("interventions") if isinstance(data, dict) else None
    if not isinstance(items, list):
        raise ValueError("Gemini response missing 'interventions' array.")

    cleaned = []
    for item in items:
        normalized = _validate_intervention(item)
        if normalized:
            cleaned.append(normalized)
    return cleaned


# ── Persistence ─────────────────────────────────────────────────────────────

async def _upsert(db: AsyncSession, student_id: int, interventions: list[dict]) -> StudentInterventions:
    payload = json.dumps(interventions)
    result = await db.execute(
        select(StudentInterventions).where(StudentInterventions.student_id == student_id)
    )
    row = result.scalar_one_or_none()
    if row:
        row.interventions_json = payload
        row.updated_at = datetime.utcnow()
    else:
        row = StudentInterventions(
            student_id=student_id,
            interventions_json=payload,
        )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


# ── Public API ──────────────────────────────────────────────────────────────

async def generate_for_student(db: AsyncSession, student_id: int) -> dict:
    """
    Orchestrate aggregate → RAG → LLM → parse → upsert.

    Returns: {"interventions": [...], "updated_at": iso_str}.
    Raises ValueError if the student has no scores yet, or if the LLM output
    cannot be parsed into any valid interventions.
    """
    courses = await _aggregate_scores(db, student_id)
    if not courses:
        raise ValueError("Student has no submitted scores yet.")

    rag_context = _build_rag_context(courses)
    raw = await _call_llm(courses, rag_context)
    interventions = _parse_interventions(raw)

    row = await _upsert(db, student_id, interventions)
    return {
        "interventions": interventions,
        "updated_at": row.updated_at.isoformat(),
    }


async def get_for_student(db: AsyncSession, student_id: int) -> dict | None:
    """
    Return saved interventions or None if the student hasn't generated them yet.
    """
    result = await db.execute(
        select(StudentInterventions).where(StudentInterventions.student_id == student_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        return None
    try:
        interventions = json.loads(row.interventions_json) or []
    except json.JSONDecodeError:
        interventions = []
    return {
        "interventions": interventions,
        "updated_at": row.updated_at.isoformat(),
    }


# ── BackgroundTasks-friendly wrapper ────────────────────────────────────────

async def generate_in_background(student_id: int, session_factory) -> None:
    """
    Self-contained coroutine that opens its own DB session.
    Designed for FastAPI BackgroundTasks: fire-and-forget, never raises.
    """
    try:
        async with session_factory() as db:
            await generate_for_student(db, student_id)
    except Exception as exc:
        # BackgroundTasks swallow exceptions silently; surface in logs instead.
        print(f"[interventions] background generation failed for student {student_id}: {exc}")
