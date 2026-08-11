"""
chat_routes.py — Career-coach chatbot backed by Gemini with persistent sessions.
"""
import json
import asyncio
from collections import defaultdict
from typing import Literal, Optional
from datetime import datetime, timezone, timedelta

# Philippine Standard Time (UTC+8) — used for human-facing labels only.
# Database timestamps remain in UTC.
PH_TZ = timezone(timedelta(hours=8))

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from sqlalchemy import create_engine, text as sql_text

from app.core.limiter import limiter
from app.api.deps import get_current_student
from app.ai.embeddings import embed_query
from app.core.config import (
    DATABASE_URL, GEMINI_MODEL, VERTEX_AI_PROJECT, VERTEX_AI_LOCATION,
    GEMINI_API_KEY, USE_GEMINI_API_KEY,
)
from app.core.database import get_session, async_session_factory
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.pipeline_models import CareerReport
from app.models.class_model import Class, Assessment, AssessmentILO, StudentScore
from app.models.github import GithubProfile, RepositoryCache, ContributionCache

# Sync engine for pgvector retrieval (same pattern as RagCareerTool)
_sync_kb_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
_sync_kb_engine = create_engine(_sync_kb_url, pool_pre_ping=True)

router = APIRouter(prefix="/chat", tags=["Chat"])

# Gemini client — AI Studio API key when available, else Vertex AI.
_MODEL_ID = GEMINI_MODEL.split("/", 1)[1] if "/" in GEMINI_MODEL else GEMINI_MODEL
_client = (
    genai.Client(api_key=GEMINI_API_KEY)
    if USE_GEMINI_API_KEY
    else genai.Client(
        vertexai=True,
        project=VERTEX_AI_PROJECT,
        location=VERTEX_AI_LOCATION,
    )
)

class ChatMessageSchema(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class CreateSessionRequest(BaseModel):
    context: dict | None = None

class CreateSessionResponse(BaseModel):
    session_id: int
    label: str

class SendMessageRequest(BaseModel):
    session_id: int
    message: str
    context: dict | None = None

class SendMessageResponse(BaseModel):
    reply: str
    session_id: int

class SessionHistoryResponse(BaseModel):
    session_id: int
    label: str | None
    messages: list[ChatMessageSchema]

class SessionListItem(BaseModel):
    session_id: int
    label: str | None
    created_at: str
    message_count: int

_BASE_SYSTEM = (
    "You are ASPIRE's AI career coach for {name}, a BSU Computer Engineering student. "
    "Be encouraging and specific. The student's "
    "FULL profile is included below — academic ILO scores, GitHub activity, and "
    "career matches. NEVER ask the student for their skill "
    "breakdown, scores, or repos — you already have all of it. Cite exact skill names, "
    "percentages, course codes, and career titles when you answer. Never invent data "
    "that isn't present.\n\n"
    "The chosen career below is the student's CURRENT goal, not a constraint on the "
    "conversation. Answer freely about ANY of the career matches, alternative paths, "
    "specific technologies, hardware vs software trade-offs, graduate study, or any "
    "other CpE-relevant topic the student raises. Do NOT redirect them back to their "
    "chosen path unless they explicitly ask for that comparison. If they ask about a "
    "career not in the matches, give your honest take grounded in their data — match "
    "score is just one signal. Only refuse if the question is truly off-topic "
    "(e.g., cooking, sports, unrelated personal advice)."
)


def _format_career_report(data: dict) -> list[str]:
    out: list[str] = []
    summary = data.get("summary") or ""
    if summary:
        out.append(f"\n## Career Report Summary\n{summary}")

    matches = data.get("career_matches") or []
    if matches:
        out.append("\n## Career Matches (best fit first)")
        for m in matches[:5]:
            title = m.get("title", "?")
            score = m.get("match_score", "?")
            rationale = (m.get("rationale") or m.get("reason") or "")[:220]
            out.append(f"- {title}: {score}% match{' — ' + rationale if rationale else ''}")

    profile = data.get("skill_profile") or {}
    unified = profile.get("unified_skills") or []
    if unified:
        out.append("\n## Skill Inventory (full list, score 0-100)")
        for s in unified[:30]:
            name = s.get("name") if isinstance(s, dict) else str(s)
            score = s.get("score") if isinstance(s, dict) else None
            out.append(f"- {name}" + (f": {score}" if score is not None else ""))

    strongest = profile.get("strongest_skills") or []
    weakest = profile.get("weakest_skills") or []
    if strongest:
        out.append("\n## Top Strengths")
        out.extend(f"- {s if isinstance(s, str) else s.get('name')}" for s in strongest[:5])
    if weakest:
        out.append("\n## Weakest Areas")
        out.extend(f"- {s if isinstance(s, str) else s.get('name')}" for s in weakest[:5])

    gaps = data.get("gap_analysis") or []
    if gaps:
        out.append("\n## Skill Gaps for Recommended Career")
        for g in gaps[:5]:
            reason = (g.get("reason") or "")[:140]
            out.append(f"- {g.get('skill')} ({g.get('priority','?')} priority): {reason}")

    recs = data.get("recommendations") or []
    if recs:
        out.append("\n## Active Recommendations")
        out.extend(f"- {r}" for r in recs[:5])
    return out


async def _format_ilo_performance(student_id: int, db: AsyncSession) -> list[str]:
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

    bucket: dict[tuple[str, str], dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
    for score, ilo, cls in rows:
        if ilo.max_score > 0:
            pct = (score.score / ilo.max_score) * 100
            bucket[(cls.course_code, cls.subject_name)][ilo.ilo_number].append(pct)

    out = ["\n## Per-Course ILO Performance (averaged across all assessments)"]
    for (code, name), ilos in bucket.items():
        avgs = [f"ILO {n}: {sum(v) / len(v):.0f}%" for n, v in sorted(ilos.items())]
        out.append(f"- {code} {name}: {', '.join(avgs)}")
    return out


async def _format_github(student_id: int, db: AsyncSession) -> list[str]:
    result = await db.execute(select(GithubProfile).where(GithubProfile.user_id == student_id))
    profile = result.scalar_one_or_none()
    if not profile:
        return []

    out = ["\n## GitHub Profile"]
    out.append(f"- Username: {profile.github_username}")
    out.append(f"- Public repos: {profile.public_repos_count}, Followers: {profile.followers_count}")
    if profile.github_bio:
        out.append(f"- Bio: {profile.github_bio}")

    repos_res = await db.execute(select(RepositoryCache).where(RepositoryCache.user_id == student_id))
    repos = repos_res.scalars().all()
    if repos:
        top = sorted(repos, key=lambda r: r.stargazer_count or 0, reverse=True)[:5]
        out.append("\n### Top Repositories")
        for r in top:
            lang = r.primary_language or "unknown"
            out.append(f"- {r.repo_name} ({lang}, {r.stargazer_count or 0}★, {r.commit_count or 0} commits)")

        lang_totals: dict[str, int] = {}
        for r in repos:
            if r.languages_json:
                try:
                    for lang, b in json.loads(r.languages_json).items():
                        lang_totals[lang] = lang_totals.get(lang, 0) + int(b)
                except (ValueError, TypeError):
                    pass
        if lang_totals:
            total = sum(lang_totals.values()) or 1
            out.append("\n### Language Breakdown")
            for lang, b in sorted(lang_totals.items(), key=lambda x: -x[1])[:5]:
                out.append(f"- {lang}: {b / total * 100:.0f}%")

    contrib_res = await db.execute(
        select(ContributionCache).where(ContributionCache.user_id == student_id)
    )
    contrib = contrib_res.scalar_one_or_none()
    if contrib:
        out.append("\n### Activity")
        out.append(
            f"- Total contributions: {contrib.total_contributions}, "
            f"Total commits: {contrib.total_commits}"
        )
        out.append(
            f"- Current streak: {contrib.current_streak} days, "
            f"Longest streak: {contrib.longest_streak} days"
        )
    return out





def _query_knowledge_base(user_message: str, top_k: int = 6) -> list[dict]:
    """
    Embed the student's message and retrieve the top-K most relevant chunks
    from the ASPIRE knowledge base — curriculum, skillsets, roadmaps, and
    career-path content. Used to ground each chat reply in BSCpE specifics
    instead of relying on the model's general world knowledge.

    Returns a list of {category, title, content} dicts. Empty on any failure.
    """
    if not user_message or not user_message.strip():
        return []
    try:
        vec = embed_query(user_message)
    except Exception as exc:
        print(f"[chat] embed_query failed: {exc}")
        return []

    sql = sql_text("""
        SELECT category, title, content,
               1 - (embedding <=> CAST(:vec AS vector)) AS similarity
        FROM knowledge_chunks
        WHERE embedding IS NOT NULL
          AND category IN ('curriculum', 'skillset', 'roadmap', 'career_path', 'ilo', 'gap_closer')
        ORDER BY embedding <=> CAST(:vec AS vector)
        LIMIT :k
    """)
    try:
        with _sync_kb_engine.connect() as conn:
            rows = conn.execute(sql, {"vec": str(vec), "k": top_k}).fetchall()
    except Exception as exc:
        print(f"[chat] knowledge query failed: {exc}")
        return []

    return [
        {"category": r.category, "title": r.title, "content": r.content}
        for r in rows
    ]


def _format_knowledge(chunks: list[dict]) -> list[str]:
    if not chunks:
        return []
    out = ["\n## Relevant ASPIRE Knowledge Base Context (semantic retrieval for this question)"]
    for c in chunks:
        out.append(f"\n### [{c['category']}] {c['title']}\n{c['content']}")
    return out


def _fallback_title_from_message(user_msg: str) -> str:
    """
    Last-resort title built from the user's own first message. Used when the
    Gemini title call fails or returns empty. Always returns a usable string.
    """
    cleaned = " ".join((user_msg or "").split()).strip("?.!,:;\"' ")
    if not cleaned:
        return "New chat"
    if len(cleaned) <= 50:
        return cleaned
    # Truncate at the last word boundary within 50 chars
    cut = cleaned[:50].rsplit(" ", 1)[0]
    return f"{cut}…"


def _generate_session_title(user_msg: str, assistant_reply: str) -> str:
    """
    Ask Gemini for a short, ChatGPT-style title (3-6 words) summarizing the
    first exchange. Falls back to a truncated version of the user's message
    if the model call fails or returns nothing usable.
    """
    prompt = (
        "Generate a short, descriptive title (3 to 6 words, no quotes, no period, "
        "no markdown, no asterisks) that captures the main topic of this conversation. "
        "Output ONLY the title text.\n\n"
        f"User: {user_msg.strip()[:600]}\n"
        f"Assistant: {assistant_reply.strip()[:600]}"
    )
    try:
        resp = _client.models.generate_content(
            model=_MODEL_ID,
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=60,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        raw = (resp.text or "").strip()
        # Strip wrapping quotes, trailing punctuation, leading bullet markers, asterisks
        title = raw.strip().strip('"').strip("'").strip(".").strip()
        title = title.lstrip("*-• ").rstrip("*").strip()
        # Collapse to single line if Gemini returned multiple
        title = title.splitlines()[0].strip() if title else ""
        if title:
            return title[:60]
        print(f"[chat] title generation returned empty; falling back to user message")
    except Exception as exc:
        print(f"[chat] title generation failed: {exc}; falling back to user message")
    return _fallback_title_from_message(user_msg)


async def _build_full_system_prompt(
    student: User,
    db: AsyncSession,
    context: dict | None,
    user_message: str | None = None,
) -> str:
    lines = [_BASE_SYSTEM.format(name=student.full_name or "Student")]

    chosen = (context or {}).get("chosen_career") or student.chosen_career
    if chosen:
        lines.append(f"\nChosen career goal: {chosen}")

    has_report_data = False

    # Career report (DB-sourced; falls back to context if no row exists yet)
    result = await db.execute(
        select(CareerReport)
        .where(CareerReport.student_id == student.id)
        .order_by(CareerReport.created_at.desc())
        .limit(1)
    )
    report = result.scalar_one_or_none()
    if report:
        try:
            report_data = json.loads(report.report_json)
            if report_data and (report_data.get("career_matches") or report_data.get("skill_profile")):
                lines.extend(_format_career_report(report_data))
                has_report_data = True
        except (ValueError, TypeError):
            pass
    elif context:
        if context.get("career_matches") or context.get("skill_profile"):
            lines.extend(_format_career_report(context))
            has_report_data = True

    ilo_perf = await _format_ilo_performance(student.id, db)
    lines.extend(ilo_perf)
    has_ilo = len(ilo_perf) > 0

    gh_perf = await _format_github(student.id, db)
    lines.extend(gh_perf)
    has_github = len(gh_perf) > 0

    # Per-turn RAG: pull curriculum/skillset/roadmap chunks relevant to THIS question
    if user_message:
        chunks = _query_knowledge_base(user_message, top_k=6)
        lines.extend(_format_knowledge(chunks))

    # Strict fallback guard against LLM hallucination:
    if not (has_report_data or has_ilo or has_github):
        lines.append(
            "\n### IMPORTANT NOTICE:\n"
            "This student has NO academic scores submitted, NO connected GitHub profile, "
            "and NO career coach report. Do NOT make up, invent, or hallucinate any match scores, "
            "percentages, skills, or repo details. State clearly and encouragingly that their "
            "profile currently has no data. Instruct the student to go to the Dashboard to "
            "connect their GitHub account, wait for instructors to enter academic grades, and "
            "then run a profile analysis to generate their first report."
        )
    return "\n".join(lines)

async def _latest_report_id(student_id: int, db: AsyncSession) -> int | None:
    result = await db.execute(
        select(CareerReport)
        .where(CareerReport.student_id == student_id)
        .order_by(CareerReport.created_at.desc())
        .limit(1)
    )
    report = result.scalar_one_or_none()
    return report.id if report else None

@router.post("/session", response_model=CreateSessionResponse)
async def create_session(
    body: CreateSessionRequest,
    current_user: User = Depends(get_current_student),
):
    async with async_session_factory() as db:
        report_id = await _latest_report_id(current_user.id, db)
        # Placeholder label — replaced by _generate_session_title on the first message exchange.
        # Keeping it generic avoids the "Apr 27 · Full Stack Developer" duplication in the sidebar.
        session = ChatSession(
            student_id=current_user.id,
            career_report_id=report_id,
            label="New chat"
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return {"session_id": session.id, "label": session.label}

@router.get("/sessions", response_model=list[SessionListItem])
async def list_sessions(
    current_user: User = Depends(get_current_student),
):
    async with async_session_factory() as db:
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.student_id == current_user.id)
            .order_by(ChatSession.updated_at.desc())
        )
        sessions = result.scalars().all()
        return [
            {
                "session_id": s.id,
                "label": s.label,
                "created_at": s.created_at.isoformat() + "Z",
                "message_count": 0  # Simplified for now
            }
            for s in sessions
        ]

@router.get("/session/{session_id}", response_model=SessionHistoryResponse)
async def get_session_history(
    session_id: int,
    current_user: User = Depends(get_current_student),
):
    async with async_session_factory() as db:
        session = await db.get(ChatSession, session_id)
        if not session or session.student_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found.")
        
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        messages = result.scalars().all()
        return {
            "session_id": session.id,
            "label": session.label,
            "messages": [{"role": m.role, "content": m.content} for m in messages]
        }

@router.delete("/session/{session_id}", status_code=204)
async def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_student),
):
    """Delete a chat session and all its messages (owned by the caller only)."""
    from sqlalchemy import delete as sql_delete
    async with async_session_factory() as db:
        session = await db.get(ChatSession, session_id)
        if not session or session.student_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found.")
        await db.execute(sql_delete(ChatMessage).where(ChatMessage.session_id == session_id))
        await db.delete(session)
        await db.commit()


@router.post("/career", response_model=SendMessageResponse)
@limiter.limit("20/minute")
async def send_career_message(
    request: Request,
    body: SendMessageRequest,
    current_user: User = Depends(get_current_student),
):
    async with async_session_factory() as db:
        session = await db.get(ChatSession, body.session_id)
        if not session or session.student_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found.")

        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == body.session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        history = result.scalars().all()

        user_msg = ChatMessage(
            session_id=body.session_id,
            role="user",
            content=body.message
        )
        db.add(user_msg)
        await db.commit()

        contents = [
            {"role": "user" if m.role == "user" else "model", "parts": [{"text": m.content}]}
            for m in history
        ]
        contents.append({"role": "user", "parts": [{"text": body.message}]})

        system_prompt = await _build_full_system_prompt(
            current_user, db, body.context, user_message=body.message
        )

        import time
        max_chat_attempts = 3
        for chat_attempt in range(1, max_chat_attempts + 1):
            try:
                response = _client.models.generate_content(
                    model=_MODEL_ID,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7,
                    ),
                )
                break # Success
            except genai_errors.APIError as e:
                err_str = str(e)
                is_rate_limit = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
                if is_rate_limit and chat_attempt < max_chat_attempts:
                    wait_secs = 2 * chat_attempt
                    print(f"[chat] Rate-limit hit (attempt {chat_attempt}/{max_chat_attempts}). Waiting {wait_secs}s...")
                    await asyncio.sleep(wait_secs)
                    continue
                raise HTTPException(status_code=502, detail=f"AI service error: {e}") from e

        reply = (response.text or "").strip()
        assistant_msg = ChatMessage(
            session_id=body.session_id,
            role="assistant",
            content=reply
        )
        db.add(assistant_msg)
        session.updated_at = datetime.now(timezone.utc)

        # Auto-title the session from the first exchange (Claude/ChatGPT-style)
        if not history:
            session.label = _generate_session_title(body.message, reply)

        db.add(session)
        await db.commit()

        return {"reply": reply, "session_id": body.session_id}
