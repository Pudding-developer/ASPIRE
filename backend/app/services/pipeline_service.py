"""
pipeline_service.py — Orchestrates the AI career-mapping pipeline.

Fetches student data from existing tables, runs the CrewAI pipeline in a
background thread, and persists results.
"""
import asyncio
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timedelta

from app.core.config import SECRET_KEY

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

# Existing models — actual names from this codebase
from app.models.user import User
from app.models.class_model import StudentScore, Assessment, AssessmentILO, Class
from app.models.github import GithubProfile, RepositoryCache, ContributionCache
from app.models.pipeline_models import PipelineJob, CareerReport
from app.ai.data.subject_skill_map import build_subject_skill_context
from app.repositories.class_repository import get_enrolled_subjects
from app.services import activity_service


# ---------------------------------------------------------------------------
# Data fetching (uses real model + field names from the ASPIRE codebase)
# ---------------------------------------------------------------------------

async def _fetch_student_data(db: AsyncSession, student_id: int) -> dict:
    """
    Collect all data the AI pipeline needs for a single student:
    - Basic profile (User table)
    - Academic scores joined with Assessment + AssessmentILO for context
    - GitHub profile, repositories, and contribution stats
    """
    # --- student profile ---
    result = await db.execute(select(User).where(User.id == student_id))
    student = result.scalar_one_or_none()
    if not student:
        raise ValueError(f"Student with id={student_id} not found.")

    # --- academic scores ---
    score_query = (
        select(StudentScore, Assessment, AssessmentILO, Class)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Class, Assessment.class_id == Class.id)
        .where(StudentScore.student_id == student_id)
    )
    result = await db.execute(score_query)
    score_rows = result.all()

    academic_scores = []
    for score, assessment, ilo, class_ in score_rows:
        pct = round((score.score / ilo.max_score) * 100, 1) if ilo.max_score > 0 else 0.0
        academic_scores.append({
            "subject_name": class_.subject_name,
            "course_code": class_.course_code,
            "assessment_name": assessment.name,
            "assessment_type": assessment.type,
            "ilo_number": ilo.ilo_number,
            "max_score": ilo.max_score,
            "score": score.score,
            "percentage": pct,
            "submitted_at": score.submitted_at.isoformat(),
        })

    # --- github profile ---
    result = await db.execute(
        select(GithubProfile).where(GithubProfile.user_id == student_id)
    )
    github_profile = result.scalar_one_or_none()

    # --- github repositories ---
    result = await db.execute(
        select(RepositoryCache).where(RepositoryCache.user_id == student_id)
    )
    repos = result.scalars().all()

    # --- github contributions ---
    result = await db.execute(
        select(ContributionCache).where(ContributionCache.user_id == student_id)
    )
    contributions = result.scalar_one_or_none()

    github_data = None
    if github_profile:
        repos_data = []
        for repo in repos:
            repos_data.append({
                "name": repo.repo_name,
                "full_name": repo.repo_full_name,
                "description": repo.description,
                "primary_language": repo.primary_language,
                "languages": json.loads(repo.languages_json) if repo.languages_json else {},
                "topics": json.loads(repo.topics_json) if repo.topics_json else [],
                "dependencies": json.loads(repo.dependencies_json) if repo.dependencies_json else {},
                "commit_count": repo.commit_count,
                "stargazer_count": repo.stargazer_count,
                "fork_count": repo.fork_count,
                "is_pinned": repo.is_pinned,
            })

        github_data = {
            "username": github_profile.github_username,
            "bio": github_profile.github_bio,
            "public_repos_count": github_profile.public_repos_count,
            "followers_count": github_profile.followers_count,
            "repositories": repos_data,
            "total_contributions": contributions.total_contributions if contributions else 0,
            "total_commits": contributions.total_commits if contributions else 0,
            "current_streak": contributions.current_streak if contributions else 0,
            "longest_streak": contributions.longest_streak if contributions else 0,
        }

    return {
        "student_id": student_id,
        "sr_code": student.sr_code,
        "full_name": student.full_name,
        "email": student.email,
        "academic_scores": academic_scores,
        "github": github_data,
    }


def _compute_input_hash(student_data: dict, subject_context: str) -> str:
    """Stable HMAC-SHA256 of the inputs that determine the AI report.

    If the same student runs Refresh Analysis twice without any new academic
    scores or GitHub activity, the digest is identical and we can short-circuit
    by returning their previous report instead of re-running the crew.

    Keyed with SECRET_KEY so a cached report from one deployment cannot be
    replayed against another with a different secret.
    """
    payload = {
        "academic_scores": student_data.get("academic_scores", []),
        "github": student_data.get("github"),
        "subject_context": subject_context,
    }
    blob = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    return hmac.new(SECRET_KEY.encode("utf-8"), blob, hashlib.sha256).hexdigest()


async def _fetch_previous_report(student_id: int, db: AsyncSession) -> str | None:
    """
    Fetches the most recent completed CareerReport for the student
    before the current analysis. Returns the report_json string or None.
    """
    from app.repositories.pipeline_repository import get_previous_report
    prev = await get_previous_report(db, student_id)
    return prev.report_json if prev else None


# ---------------------------------------------------------------------------
# Job helpers
# ---------------------------------------------------------------------------

async def _update_job(
    db: AsyncSession, job_id: str, **kwargs
) -> None:
    result = await db.execute(select(PipelineJob).where(PipelineJob.id == job_id))
    job = result.scalar_one_or_none()
    if job:
        for key, value in kwargs.items():
            setattr(job, key, value)
        db.add(job)
        await db.commit()


# ---------------------------------------------------------------------------
# Skill-milestone diff
# ---------------------------------------------------------------------------

MILESTONE_THRESHOLD = 80.0
MILESTONE_MAX_PER_RUN = 3


def _extract_skill_scores(report_payload: dict | None) -> dict[str, float]:
    """Pull a {name -> final_score} map out of a report's unified_skills list.

    Tolerant of both 'name' and 'skill' keys, and of skills represented as
    bare strings (no score) which we ignore.
    """
    if not report_payload:
        return {}
    profile = report_payload.get("skill_profile") or {}
    unified = profile.get("unified_skills") or []
    out: dict[str, float] = {}
    for s in unified:
        if not isinstance(s, dict):
            continue
        name = s.get("name") or s.get("skill")
        score = s.get("final_score")
        if score is None:
            score = s.get("score")
        if not name or score is None:
            continue
        try:
            val = float(score)
        except (TypeError, ValueError):
            continue
        if val != val:  # NaN
            continue
        out[str(name).strip()] = val
    return out


def _level_for(score: float) -> str:
    if score >= 90:
        return "Expert"
    return "Advanced"


def _newly_crossed_milestones(
    current: dict[str, float],
    previous: dict[str, float],
) -> list[tuple[str, float]]:
    """Skills that crossed >=MILESTONE_THRESHOLD this run.

    First-time runs (no previous data at all) emit nothing — skills were
    already there, just newly-analysed. Skills present in both reports emit
    only when the previous score was below the threshold.
    """
    if not previous:
        return []
    crossed: list[tuple[str, float]] = []
    for name, score in current.items():
        if score < MILESTONE_THRESHOLD:
            continue
        prev_score = previous.get(name)
        if prev_score is not None and prev_score < MILESTONE_THRESHOLD:
            crossed.append((name, score))
    crossed.sort(key=lambda t: t[1], reverse=True)
    return crossed[:MILESTONE_MAX_PER_RUN]


# ---------------------------------------------------------------------------
# Career completeness guard
# ---------------------------------------------------------------------------
# NOTE: Career titles and required-skill keyword sets are no longer hardcoded
# here. They are loaded once from the knowledge_chunks DB table via
# career_catalog.get_sync_catalog(). To add a new career, update the knowledge
# base — nothing in this file needs to change.


def _generate_career_recommendations(gap_skills: list[str], career_title: str) -> list[str]:
    """
    Dynamically generate per-career recommendations from the gap_skills list.
    Queries the knowledge base for gap_closer / resources content matching
    each gap skill. Falls back to a descriptive action item if nothing found.
    Uses a sync engine since this runs inside the pipeline thread.
    """
    from sqlalchemy import create_engine, text as sa_text
    from app.core.config import DATABASE_URL

    sync_url = DATABASE_URL.replace("+asyncpg", "").replace("+psycopg2", "")
    sync_engine = create_engine(sync_url, pool_pre_ping=True)

    recs: list[str] = []

    # Normalise gap skill names for searching
    skill_names = [
        (s if isinstance(s, str) else s.get("name", "")).strip()
        for s in gap_skills
    ]
    skill_names = [s for s in skill_names if s]

    try:
        with sync_engine.connect() as conn:
            for skill in skill_names:
                # Search knowledge base for gap_closer / resources matching this skill
                row = conn.execute(sa_text("""
                    SELECT title, content
                    FROM knowledge_chunks
                    WHERE category IN ('gap_closer', 'resources')
                      AND (LOWER(content) LIKE :kw OR LOWER(title) LIKE :kw)
                    ORDER BY category DESC
                    LIMIT 1
                """), {"kw": f"%{skill.lower()}%"}).fetchone()

                if row:
                    # Extract first 2 sentences from content as the recommendation
                    content = row.content.strip().replace("\n", " ")
                    sentences = [s.strip() for s in content.split(".") if s.strip()]
                    summary = ". ".join(sentences[:2]) + "."
                    rec = f"{skill.title()}: {summary}"
                else:
                    # Fallback: descriptive action item from skill name and career
                    rec = (
                        f"{skill.title()}: Build practical experience with {skill} "
                        f"to strengthen your {career_title} profile. "
                        f"Look for project-based tutorials on roadmap.sh or freeCodeCamp."
                    )
                recs.append(rec)
    except Exception as e:
        print(f"[pipeline] _generate_career_recommendations error: {e}")
        # Graceful degradation: return skill-name-only descriptions
        recs = [
            f"{s.title()}: Practice {s} to close this gap for {career_title}."
            for s in skill_names
        ]

    return recs[:6]  # Cap at 6 recommendations per career


def _enrich_all_careers_with_recommendations(pipeline_result: dict) -> None:
    """
    For every career_match entry that has gap_skills but no career_recommendations,
    generate and attach per-career recommendations dynamically from the knowledge base.
    This runs for ALL careers (both AI-scored and fallback).
    """
    for match in pipeline_result.get("career_matches", []):
        if not isinstance(match, dict):
            continue
        # Skip if already has recommendations
        if match.get("career_recommendations"):
            continue
        gap_skills = match.get("gap_skills", [])
        if not gap_skills:
            continue
        title = match.get("title", "this career")
        match["career_recommendations"] = _generate_career_recommendations(gap_skills, title)


def _ensure_all_careers_present(pipeline_result: dict) -> None:
    """
    Post-processing guard: ensure every career in the knowledge base
    appears in pipeline_result['career_matches']. If the LLM dropped any,
    we insert a stub entry with a deterministic score calculated from the
    student's actual unified_skills final_scores.

    Career titles and required-skill keyword sets are loaded from the DB via
    career_catalog.get_sync_catalog() — no hardcoded lists in this file.
    """
    from app.services.career_catalog import get_sync_catalog
    from app.ai.scoring import build_skill_index, evaluate_career_skills, compute_match_score

    # Load career catalog (cached after first call)
    catalog = get_sync_catalog()
    required_titles = {c["title"] for c in catalog}
    # Build required-skill keyword map from the parsed knowledge-base content
    career_required_skills: dict[str, list[str]] = {
        c["title"]: list(c["required_skills"]) for c in catalog
    }
    # Roadmap URL map (so fallback stubs get the correct link)
    career_roadmap: dict[str, str] = {c["title"]: c["roadmap"] for c in catalog}

    existing = pipeline_result.get("career_matches", [])
    present_titles = {m.get("title", "") for m in existing if isinstance(m, dict)}

    missing = required_titles - present_titles
    if not missing:
        return  # All good — nothing to fill in

    # Build a {skill_name_lower -> final_score} map from unified_skills.
    unified = pipeline_result.get("skill_profile", {}).get("unified_skills", [])
    skill_index = build_skill_index(unified)

    for title in missing:
        required_kws = career_required_skills.get(title, [])
        if not required_kws:
            score = 0
            matched_skills: list[str] = []
        else:
            matched_skills, gap_skills = evaluate_career_skills(required_kws, skill_index)
            score = compute_match_score(
                matched_skills=matched_skills,
                gap_skills=gap_skills,
                skill_index=skill_index,
                has_github_bonus=False
            )

        existing.append({
            "title": title,
            "match_score": score,
            "matched_skills": matched_skills,
            "gap_skills": [kw for kw in required_kws if kw not in matched_skills][:6],
            "reasoning": f"Fallback score: {len(matched_skills)}/{len(required_kws)} required skills matched from academic profile (career omitted by AI).",
            "roadmap_url": career_roadmap.get(title, ""),
        })
        print(f"[pipeline] Filled missing career '{title}' with fallback score={score}%")

    # Re-sort so the list stays ordered by score descending
    pipeline_result["career_matches"] = sorted(
        existing, key=lambda c: c.get("match_score", 0), reverse=True
    )
async def write_markdown_report_to_artifacts(db: AsyncSession, student: User, report: CareerReport) -> None:
    """
    Generate the markdown version of the student's career report and write it
    to the artifacts directory in the workspace.
    """
    import os
    from app.repositories.class_repository import get_enrolled_subjects
    from app.ai.data.subject_skill_map import get_subject_skills
    from app.ai.scoring import canonicalize
    
    # Target directory
    artifacts_dir = "/home/humunculey/ASPIRE/artifacts/student_career_reports"
    os.makedirs(artifacts_dir, exist_ok=True)
    
    # Fetch connected github account for this student
    github_result = await db.execute(
        select(GithubProfile).where(GithubProfile.user_id == student.id)
    )
    github_profile = github_result.scalar_one_or_none()
    github_username = github_profile.github_username if github_profile else None
    
    # Formatting logic
    report_data = json.loads(report.report_json) if report.report_json else {}
    created_at_str = str(report.created_at)
    chosen_career = student.chosen_career or "Not Selected"
    
    if github_username:
        github_account_str = f"[@{github_username}](https://github.com/{github_username})"
    else:
        github_account_str = "*Not Connected*"
        
    # Build a mapping of student's completed academic courses to skills
    enrolled_subjects = await get_enrolled_subjects(db, student.id)
    skill_to_subjects = {}
    for subject in enrolled_subjects:
        mapping = get_subject_skills(subject)
        if mapping:
            for skill in mapping.get("primary_skills", []):
                canon_s = canonicalize(skill)
                if canon_s not in skill_to_subjects:
                    skill_to_subjects[canon_s] = []
                if subject not in skill_to_subjects[canon_s]:
                    skill_to_subjects[canon_s].append(subject)

    # Build a mapping of skills to their source (academic/github/both)
    skill_profile = report_data.get("skill_profile", {})
    skill_sources = {}
    for s in skill_profile.get("unified_skills", []):
        name = s.get("skill") or s.get("name")
        if name:
            skill_sources[canonicalize(name)] = s.get("source")
            
    # Format matches table
    matches_rows = []
    career_matches = report_data.get("career_matches", [])
    career_matches = sorted(career_matches, key=lambda x: x.get("match_score", 0), reverse=True)
    
    for match in career_matches:
        title = match.get("title", "")
        score = match.get("match_score", 0)
        
        # Format matched skills with their source subjects/github
        matched_formatted = []
        for s in match.get("matched_skills", []):
            canon_s = canonicalize(s)
            subjects = skill_to_subjects.get(canon_s, [])
            source = skill_sources.get(canon_s)
            
            if subjects and source == "both":
                subjects_str = ", ".join(subjects)
                matched_formatted.append(f"{s} (via {subjects_str} & GitHub)")
            elif subjects:
                subjects_str = ", ".join(subjects)
                matched_formatted.append(f"{s} (via {subjects_str})")
            elif source == "github":
                matched_formatted.append(f"{s} (via GitHub)")
            else:
                matched_formatted.append(s)
                
        matched_str = ", ".join(matched_formatted) or "*None*"
        
        gaps = []
        for gap in match.get("gap_skills", []):
            if isinstance(gap, dict):
                gaps.append(gap.get("skill", ""))
            else:
                gaps.append(str(gap))
        gaps_str = ", ".join(gaps) or "*None*"
        matches_rows.append(f"| **{title}** | `{score}%` | {matched_str} | {gaps_str} |")
        
    matches_table = "\n".join(matches_rows)
    
    # Identify target career for prioritization
    target_career = student.chosen_career
    if not target_career or target_career == "Not Selected":
        if career_matches:
            target_career = career_matches[0].get("title")

    # Helper function to check career relevance
    def is_relevant(rel_list, target):
        t_low = target.lower()
        for r in rel_list:
            r_low = r.lower()
            if r_low == "all careers" or r_low == "all":
                return True
            if r_low == t_low:
                return True
            if "frontend" in t_low and "full stack" in r_low:
                return True
            if "iot" in t_low and ("iot" in r_low or "embedded" in r_low):
                return True
            if "fpga" in t_low and ("embedded" in r_low or "hardware" in r_low):
                return True
            if "vlsi" in t_low and ("embedded" in r_low or "hardware" in r_low):
                return True
            if "machine learning" in t_low and ("ml" in r_low or "ai" in r_low or "data scientist" in r_low):
                return True
            if "ai" in t_low and ("ai" in r_low or "machine learning" in r_low or "data scientist" in r_low):
                return True
        return False

    # Find prioritized subjects that the student has not taken yet
    from app.ai.data.subject_skill_map import SUBJECT_SKILL_MAP
    prioritized_subjects = []
    if target_career:
        for subject_name, info in SUBJECT_SKILL_MAP.items():
            relevance = info.get("career_relevance", [])
            if is_relevant(relevance, target_career):
                if subject_name not in enrolled_subjects:
                    skills_list = ", ".join(info.get("primary_skills", []))
                    category = ", ".join(info.get("skillset_categories", []))
                    prioritized_subjects.append(
                        f"- **{subject_name}** (Focus: *{skills_list}* | Category: *{category}*)"
                    )

    prioritized_subjects_section = ""
    if prioritized_subjects:
        subj_list_str = "\n".join(prioritized_subjects)
        prioritized_subjects_section = f"""
### 📚 Recommended Academic Subjects to Prioritize (for {target_career})
These upcoming subjects in the BSCpE curriculum align directly with this career path. Prioritize these in your study plan:
{subj_list_str}
"""
    
    # Skill profile
    skill_profile = report_data.get("skill_profile", {})
    summary_metrics = skill_profile.get("skill_summary", {})
    
    strongest_list = []
    for s in skill_profile.get("strongest_skills", []):
        if isinstance(s, dict):
            strongest_list.append(s.get("skill", ""))
        else:
            strongest_list.append(str(s))
    strongest = ", ".join(strongest_list) or "None identified"
    
    needs_attention_skills = [
        f"{s.get('skill')} ({s.get('final_score')}%)"
        for s in skill_profile.get("unified_skills", [])
        if s.get("status") in ["NEEDS ATTENTION", "CRITICAL"]
    ]
    needs_attention_str = "\n".join([f"  - {s}" for s in needs_attention_skills]) if needs_attention_skills else "  - *None*"
    
    # Gap analysis
    gap_analysis = report_data.get("gap_analysis", [])
    gap_rows = []
    for gap in gap_analysis:
        skill = gap.get("skill", "")
        priority = gap.get("priority", "medium").capitalize()
        est = f"{gap.get('estimated_weeks', 0)} Weeks"
        reason = gap.get("reason", "")
        gap_rows.append(f"| **{skill}** | **{priority}** | {est} | {reason} |")
    gap_table = "\n".join(gap_rows)
    
    # Progress
    progress = report_data.get("progress", {})
    readiness_score = progress.get("career_readiness_score", 0)
    score_change = progress.get("readiness_score_change", 0)
    trend = progress.get("trend", "baseline")
    progress_summary = progress.get("summary", "")
    
    md_content = f"""# Career Coach Report: {student.full_name}

This document details the AI-generated Career Coach report and readiness assessment for **{student.full_name}** as retrieved from the ASPIRE database.

---

## 👤 Student Profile
- **Full Name:** {student.full_name}
- **SR Code:** `{student.sr_code}`
- **Email:** `{student.email}`
- **GitHub Account:** {github_account_str}
- **Chosen Career:** {chosen_career}
- **Report Date:** {created_at_str}
- **Report ID:** `{report.id}` (Job ID: `{report.job_id}`)

---

## 📝 Executive Summary
{report.summary or "No summary available."}

---

## 📊 Career Compatibility Analysis

Below is the compatibility analysis across all assessed career paths, sorted by match score:

| Career Title | Match Score | Matched Skills | Key Gaps |
| :--- | :---: | :--- | :--- |
{matches_table}

---

## 🛠️ Skill Profile

{student.full_name} has **{summary_metrics.get('total_skills', 0)} total assessed skills** split between academic coursework and GitHub history.

### Summary Metrics
- 🌟 **Exceeding Expectations:** {summary_metrics.get('exceeding', 0)}
- 🟢 **On Track:** {summary_metrics.get('on_track', 0)}
- 🟡 **Needs Attention:** {summary_metrics.get('needs_attention', 0)}
- 🔴 **Critical:** {summary_metrics.get('critical', 0)}

### Strongest & Weakest Areas
> [!NOTE]
> Strongest skills are primarily academic/mathematical, while weaker skills represent niche technologies not yet fully explored.

- **Strongest Skills:** {strongest}
- **Weakest Skills (Needs Attention):**
{needs_attention_str}

---

## 🎯 Gap Analysis & Action Plan

Based on the recommended career paths, the AI Career Coach recommends the following learning roadmap to close key gaps:

| Skill | Priority | Est. Time | Actionable Recommendation / Reason |
| :--- | :---: | :---: | :--- |
{gap_table}
{prioritized_subjects_section}
---

## 📈 Progression & Trends
- **Career Readiness Score:** `{readiness_score} / 100`
- **Readiness Score Change:** `{score_change}`
- **Trend:** {trend.capitalize()}
- **Progress Summary:** {progress_summary}

> [!TIP]
> Readiness scores increase dynamically as the student closes gaps via commits on GitHub or academic grades.
"""

    filename = student.full_name.lower().replace(" ", "_") + "_career_report.md"
    file_path = os.path.join(artifacts_dir, filename)
    with open(file_path, "w") as f:
        f.write(md_content)
    print(f"[pipeline] Wrote updated markdown report to: {file_path}")


# ---------------------------------------------------------------------------
# Background pipeline task
# ---------------------------------------------------------------------------

# Registry of active asyncio tasks: student_id -> asyncio.Task
_running_tasks = {}

async def run_pipeline_job(
    job_id: str, student_id: int, session_factory, force: bool = False
) -> None:
    """
    Background task — fetches data + previous report, runs the 7-agent CrewAI pipeline
    in a thread, and stores the result including Agent 7 progression data.
    Progress steps mirror the 7 agents for frontend polling.
    """
    current_task = asyncio.current_task()
    _running_tasks[student_id] = current_task
    try:
        async with session_factory() as db:
            try:
                # ── Pre-flight: collect student data and previous report ───────────
                await _update_job(
                    db, job_id,
                    status="running",
                    current_step="Collecting student data...",
                    percentage=5,
                )
                student_data = await _fetch_student_data(db, student_id)

                # Fetch student for chosen_career field
                result = await db.execute(select(User).where(User.id == student_id))
                student = result.scalar_one_or_none()

                # Fetch previous report for Agent 7 comparison
                from app.repositories.pipeline_repository import get_previous_report
                previous_report = await get_previous_report(db, student_id)

                days_since = None
                if previous_report:
                    days_since = (datetime.utcnow() - previous_report.created_at).days

                # ── Step 1 progress label ─────────────────────────────────────────
                await _update_job(
                    db, job_id,
                    current_step="Analyzing GitHub repositories...",
                    percentage=10,
                )

                # ── Step 2 progress label (set before blocking thread) ────────────
                await _update_job(
                    db, job_id,
                    current_step="Processing academic performance...",
                    percentage=25,
                )

                # --- fetch previous report for tracking ---
                prev_report_json = await _fetch_previous_report(student_id, db)

                # --- fetch enrolled subjects and build mapping context ---
                enrolled_subjects = await get_enrolled_subjects(db, student_id)
                subject_context = build_subject_skill_context(enrolled_subjects)

                # ── Short-circuit: if inputs haven't changed since last report, reuse it ─
                # Skipped when force=True so the user can manually re-run the AI crew.
                input_hash = _compute_input_hash(student_data, subject_context)
                if not force and previous_report and previous_report.report_json:
                    try:
                        prev_payload = json.loads(previous_report.report_json)
                        if prev_payload.get("_input_hash") == input_hash:
                            print(f"[pipeline] Input unchanged — returning cached report (hash={input_hash[:8]})")
                            await _update_job(
                                db, job_id,
                                status="completed",
                                current_step="No new data — returning previous report",
                                percentage=100,
                                completed_at=datetime.utcnow(),
                            )
                            return
                    except (json.JSONDecodeError, AttributeError):
                        pass  # Fall through to a real run.

                # ── Run the entire 7-agent crew in a background thread ────────────
                from app.ai.crew import build_and_run_crew
                from app.core.database import engine

                # Crew.py runs in a synchronous thread. We must pass a sync db session
                # if we want it to read/write the GithubSkillCache.
                def _run_crew_with_sync_db():
                    from sqlalchemy.orm import Session
                    # The engine in app.core.database is usually an async engine.
                    # However, SQLModel/SQLAlchemy async engines cannot be used synchronously.
                    # We need to construct a synchronous engine string from the async one.
                    from app.core.config import DATABASE_URL
                    sync_url = DATABASE_URL.replace("+asyncpg", "").replace("+psycopg2", "")
                    from sqlalchemy import create_engine
                    sync_engine = create_engine(sync_url)
                    
                    with Session(sync_engine) as sync_db:
                        return build_and_run_crew(
                            student_data,
                            prev_report_json,
                            subject_context,
                            student_id=student_id,
                            sync_db=sync_db
                        )

                pipeline_result = await asyncio.to_thread(_run_crew_with_sync_db)

                # Stamp the input hash so the next run can detect "no change".
                pipeline_result["_input_hash"] = input_hash

                # ── Ensure ALL frontend career options appear in career_matches ────
                # The LLM sometimes drops careers it deems irrelevant. This guard
                # fills in any missing titles with a deterministic fallback score
                # so every pinned card always shows a value.
                _ensure_all_careers_present(pipeline_result)

                # ── Enrich every career entry with per-career recommendations ─────
                # Generates career_recommendations[] for each career from its
                # gap_skills, querying the knowledge base — no hardcoded content.
                _enrich_all_careers_with_recommendations(pipeline_result)

                # ── If crew returned a fallback error, propagate it ──────────────
                if pipeline_result.get("error"):
                    crew_error = pipeline_result["error"]
                    print(f"[pipeline] Crew returned fallback error: {crew_error}")
                    await _update_job(
                        db, job_id,
                        status="failed",
                        error=f"AI Pipeline error: {crew_error}",
                        completed_at=datetime.utcnow(),
                    )
                    return

                # ── Post-pipeline progress labels (fast — just DB writes) ─────────
                await _update_job(
                    db, job_id,
                    current_step="Synthesizing skill profile...",
                    percentage=40,
                )
                await _update_job(
                    db, job_id,
                    current_step="Mapping career paths...",
                    percentage=55,
                )
                await _update_job(
                    db, job_id,
                    current_step="Analyzing skill gaps...",
                    percentage=70,
                )
                await _update_job(
                    db, job_id,
                    current_step="Generating career report...",
                    percentage=85,
                )
                await _update_job(
                    db, job_id,
                    current_step="Tracking your progress...",
                    percentage=95,
                )

                # ── Persist the report + progression ─────────────────────────────
                progress_data = pipeline_result.get("progress", {})
                chosen = (student.chosen_career if student else None)

                report = CareerReport(
                    student_id=student_id,
                    job_id=job_id,
                    report_json=json.dumps(pipeline_result, default=str),
                    summary=pipeline_result.get("summary", ""),
                    created_at=datetime.utcnow(),
                    chosen_career=chosen,
                    progression_json=json.dumps(progress_data, default=str),
                )
                db.add(report)
                await db.commit()

                await activity_service.emit_career_updated(
                    db, student_id=student_id, career_name=chosen,
                )

                current_scores = _extract_skill_scores(pipeline_result)
                previous_scores: dict[str, float] = {}
                if previous_report and previous_report.report_json:
                    try:
                        previous_scores = _extract_skill_scores(
                            json.loads(previous_report.report_json)
                        )
                    except (json.JSONDecodeError, TypeError):
                        previous_scores = {}
                for skill_name, score in _newly_crossed_milestones(current_scores, previous_scores):
                    await activity_service.emit_skill_milestone(
                        db,
                        student_id=student_id,
                        skill_name=skill_name,
                        level=_level_for(score),
                    )

                await db.commit()

                # Generate and save markdown report to filesystem artifacts
                try:
                    await write_markdown_report_to_artifacts(db, student, report)
                except Exception as e:
                    print(f"[pipeline] Failed to write markdown report to artifacts: {e}")

                # ── Done ──────────────────────────────────────────────────────────
                await _update_job(
                    db, job_id,
                    status="completed",
                    current_step="Career report ready",
                    percentage=100,
                    completed_at=datetime.utcnow(),
                )

            except asyncio.CancelledError:
                print(f"[pipeline] Task cancelled for student {student_id}, job {job_id}")
                async def cleanup():
                    async with session_factory() as cleanup_db:
                        await _update_job(
                            cleanup_db, job_id,
                            status="failed",
                            current_step="Cancelled",
                            percentage=100,
                            error="Cancelled by user",
                            completed_at=datetime.utcnow(),
                        )
                await asyncio.shield(cleanup())
                raise
            except Exception as exc:
                error_str = str(exc)
                # If it's just empty data — mark as complete with warning, not as failed
                if "no academic" in error_str.lower() or "empty" in error_str.lower():
                    await _update_job(
                        db, job_id,
                        status="completed",
                        current_step="Career report ready",
                        percentage=100,
                        completed_at=datetime.utcnow(),
                    )
                else:
                    await _update_job(
                        db, job_id,
                        status="failed",
                        error=error_str,
                        completed_at=datetime.utcnow(),
                    )
    finally:
        _running_tasks.pop(student_id, None)


async def cancel_running_job(db: AsyncSession, student_id: int) -> bool:
    """Cancel the running pipeline job for the student if one exists."""
    task = _running_tasks.pop(student_id, None)
    
    # Also find and update the running job in the database to failed
    from sqlmodel import select
    from app.models.pipeline_models import PipelineJob
    result = await db.execute(
        select(PipelineJob)
        .where(PipelineJob.student_id == student_id)
        .where(PipelineJob.status == "running")
    )
    job = result.scalar_one_or_none()
    if job:
        job.status = "failed"
        job.error = "Cancelled by user"
        job.completed_at = datetime.utcnow()
        await db.commit()

    if task:
        task.cancel()
        return True
    return False



# ---------------------------------------------------------------------------
# Query helpers (called by router)
# ---------------------------------------------------------------------------

async def create_job(db: AsyncSession, student_id: int) -> PipelineJob:
    job = PipelineJob(
        id=str(uuid.uuid4()),
        student_id=student_id,
        status="pending",
        started_at=datetime.utcnow(),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def get_job(db: AsyncSession, job_id: str) -> PipelineJob | None:
    result = await db.execute(select(PipelineJob).where(PipelineJob.id == job_id))
    return result.scalar_one_or_none()


ORPHAN_THRESHOLD = timedelta(minutes=10)


async def get_running_job(db: AsyncSession, student_id: int) -> PipelineJob | None:
    result = await db.execute(
        select(PipelineJob).where(
            PipelineJob.student_id == student_id,
            PipelineJob.status.in_(["pending", "running"]),
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        return None
    # Auto-fail orphans: a real crew run completes well under 10 min, so anything
    # older was almost certainly killed by a server restart or crash.
    if job.started_at and datetime.utcnow() - job.started_at > ORPHAN_THRESHOLD:
        job.status = "failed"
        job.error = "Job orphaned (server restart or crash)"
        job.completed_at = datetime.utcnow()
        db.add(job)
        await db.commit()
        return None
    return job


async def get_latest_report(db: AsyncSession, student_id: int) -> CareerReport | None:
    result = await db.execute(
        select(CareerReport)
        .where(CareerReport.student_id == student_id)
        .order_by(CareerReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_all_reports(db: AsyncSession, student_id: int) -> list[CareerReport]:
    result = await db.execute(
        select(CareerReport)
        .where(CareerReport.student_id == student_id)
        .order_by(CareerReport.created_at.desc())
    )
    return list(result.scalars().all())
