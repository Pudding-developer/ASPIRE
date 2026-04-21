"""
pipeline_service.py — Orchestrates the AI career-mapping pipeline.

Fetches student data from existing tables, runs the CrewAI pipeline in a
background thread, and persists results.
"""
import asyncio
import json
import uuid
import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

# Existing models — actual names from this codebase
from app.models.user import User
from app.models.class_model import StudentScore, Assessment, AssessmentILO
from app.models.github import GithubProfile, RepositoryCache, ContributionCache
from app.models.pipeline_models import PipelineJob, CareerReport
from app.ai.data.subject_skill_map import build_subject_skill_context
from app.repositories.class_repository import get_enrolled_subjects


STALE_JOB_THRESHOLD_MINUTES = 60
logger = logging.getLogger(__name__)


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
        select(StudentScore, Assessment, AssessmentILO)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .where(StudentScore.student_id == student_id)
    )
    result = await db.execute(score_query)
    score_rows = result.all()

    academic_scores = []
    for score, assessment, ilo in score_rows:
        pct = round((score.score / ilo.max_score) * 100, 1) if ilo.max_score > 0 else 0.0
        academic_scores.append({
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
        "chosen_career": student.chosen_career,
        "academic_scores": academic_scores,
        "github": github_data,
    }


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
# Background pipeline task
# ---------------------------------------------------------------------------

async def run_pipeline_job(
    job_id: str, student_id: int, session_factory
) -> None:
    """
    Background task — fetches data + previous report, runs the 7-agent CrewAI pipeline
    in a thread, and stores the result including Agent 7 progression data.
    Progress steps mirror the 7 agents for frontend polling.
    """
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

            # ── Initial progress label before blocking thread ─────────────────
            await _update_job(
                db, job_id,
                current_step="Analyzing GitHub repositories...",
                percentage=10,
            )

            # --- fetch previous report for tracking ---
            prev_report_json = await _fetch_previous_report(student_id, db)

            # --- fetch enrolled subjects and build mapping context ---
            enrolled_subjects = await get_enrolled_subjects(db, student_id)
            subject_context = build_subject_skill_context(enrolled_subjects)

            # ── Define a callback for the background thread to update the DB ──
            loop = asyncio.get_running_loop()
            
            def progress_callback(step_name: str, percentage: int):
                # Schedules the async DB update back on the main event loop
                asyncio.run_coroutine_threadsafe(
                    _update_job(db, job_id, current_step=step_name, percentage=percentage),
                    loop
                )

            # ── Run the entire 7-agent crew in a background thread ────────────
            from app.ai.crew import build_and_run_crew

            pipeline_result = await asyncio.to_thread(
                build_and_run_crew, 
                student_data, 
                prev_report_json,
                subject_context,
                progress_callback
            )

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

            # ── Done ──────────────────────────────────────────────────────────
            await _update_job(
                db, job_id,
                status="completed",
                current_step="Career report ready",
                percentage=100,
                completed_at=datetime.utcnow(),
            )

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


async def get_running_job(db: AsyncSession, student_id: int) -> PipelineJob | None:
    result = await db.execute(
        select(PipelineJob).where(
            PipelineJob.student_id == student_id,
            PipelineJob.status.in_(["pending", "running"]),
        )
    )
    job = result.scalar_one_or_none()

    if job:
        # Calculate how long it has been since job.started_at
        elapsed = datetime.utcnow() - job.started_at
        if elapsed > timedelta(minutes=STALE_JOB_THRESHOLD_MINUTES):
            logger.warning(f"Cleaning up stale job {job.id} for student {student_id} (elapsed: {elapsed})")
            job.status = "failed"
            job.error = (
                "Job timed out — exceeded 60 minute threshold. "
                "This is usually caused by LLM rate limits, network issues, or server restart."
            )
            job.completed_at = datetime.utcnow()
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
