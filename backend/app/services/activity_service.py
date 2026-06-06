"""
activity_service.py — Emits and reads user-facing activity feed events.

Each helper builds the per-event title/subtitle from the actual record
(no placeholder copy). Adding a new event type means adding a new
emit_* helper here and wiring it into the source service.
"""
import json
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import activity_repository
from app.models.activity import ActivityEvent


# ── Output shape ──────────────────────────────────────────────────────────────

def _to_dict(e: ActivityEvent) -> dict:
    try:
        payload = json.loads(e.payload_json) if e.payload_json else {}
    except json.JSONDecodeError:
        payload = {}
    return {
        "id": e.id,
        "type": e.type,
        "title": e.title,
        "subtitle": e.subtitle,
        "payload": payload,
        "unread": e.read_at is None,
        "created_at": (e.created_at.isoformat() + "Z") if e.created_at else None,
    }


async def list_for_user(
    session: AsyncSession,
    user_id: int,
    limit: int = 10,
    unread_only: bool = False,
) -> list[dict]:
    events = await activity_repository.list_events_for_user(
        session, user_id, limit=limit, unread_only=unread_only
    )
    return [_to_dict(e) for e in events]


async def mark_all_read(session: AsyncSession, user_id: int) -> None:
    await activity_repository.mark_all_read(session, user_id)


# ── Emit helpers ──────────────────────────────────────────────────────────────

async def emit_grade_released(
    session: AsyncSession,
    student_ids: list[int],
    subject_name: str,
    assessment_name: str,
    class_id: int,
    assessment_id: int,
) -> None:
    """One event per enrolled student when an assessment is posted."""
    if not student_ids:
        return
    payload = json.dumps({
        "class_id": class_id,
        "assessment_id": assessment_id,
        "subject_name": subject_name,
        "assessment_name": assessment_name,
    })
    title = f"{subject_name} Grade Released"
    subtitle = assessment_name
    events = [
        {
            "user_id": sid,
            "type": "grade_released",
            "title": title,
            "subtitle": subtitle,
            "payload_json": payload,
        }
        for sid in student_ids
    ]
    await activity_repository.insert_events_bulk(session, events)


async def emit_career_updated(
    session: AsyncSession,
    student_id: int,
    career_name: Optional[str],
) -> None:
    title = (
        f"New progression on {career_name}"
        if career_name
        else "Career paths updated"
    )
    payload = json.dumps({"career_name": career_name})
    await activity_repository.insert_event(
        session,
        user_id=student_id,
        type="career_updated",
        title=title,
        subtitle="Career analysis refreshed",
        payload_json=payload,
    )


async def emit_github_synced(
    session: AsyncSession,
    student_id: int,
    repo_count: Optional[int] = None,
    repo_name: Optional[str] = None,
    new_commits: int = 0,
) -> None:
    title = "GitHub Repo Synchronized"
    if new_commits and repo_name:
        subtitle = f"{repo_name} · {new_commits} new commits"
    elif repo_name:
        subtitle = repo_name
    elif new_commits:
        subtitle = f"{new_commits} new commits detected"
    elif repo_count is not None:
        subtitle = f"{repo_count} repositories analyzed"
    else:
        subtitle = "Repositories refreshed"
    payload = json.dumps({
        "repo_name": repo_name,
        "repo_count": repo_count,
        "new_commits": new_commits,
    })
    await activity_repository.insert_event(
        session,
        user_id=student_id,
        type="github_synced",
        title=title,
        subtitle=subtitle,
        payload_json=payload,
    )


async def emit_skill_milestone(
    session: AsyncSession,
    student_id: int,
    skill_name: str,
    level: str,
) -> None:
    payload = json.dumps({"skill_name": skill_name, "level": level})
    await activity_repository.insert_event(
        session,
        user_id=student_id,
        type="skill_milestone",
        title="Skill Milestone Reached",
        subtitle=f"{level} in {skill_name}",
        payload_json=payload,
    )
