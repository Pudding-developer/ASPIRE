"""
activity_repository.py — Persistence for user-facing activity feed events.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.activity import ActivityEvent


async def insert_event(
    session: AsyncSession,
    user_id: int,
    type: str,
    title: str,
    subtitle: str = "",
    payload_json: str = "{}",
) -> ActivityEvent:
    event = ActivityEvent(
        user_id=user_id,
        type=type,
        title=title,
        subtitle=subtitle,
        payload_json=payload_json,
    )
    session.add(event)
    await session.flush()
    return event


async def insert_events_bulk(
    session: AsyncSession,
    events: list[dict],
) -> None:
    """Bulk insert; each dict must contain user_id, type, title, subtitle, payload_json."""
    for e in events:
        session.add(ActivityEvent(**e))
    await session.flush()


async def list_events_for_user(
    session: AsyncSession,
    user_id: int,
    limit: int = 10,
    unread_only: bool = False,
) -> list[ActivityEvent]:
    stmt = select(ActivityEvent).where(ActivityEvent.user_id == user_id)
    if unread_only:
        stmt = stmt.where(ActivityEvent.read_at.is_(None))
    stmt = stmt.order_by(ActivityEvent.created_at.desc()).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def mark_all_read(session: AsyncSession, user_id: int) -> None:
    from sqlalchemy import update
    await session.execute(
        update(ActivityEvent)
        .where(ActivityEvent.user_id == user_id, ActivityEvent.read_at.is_(None))
        .values(read_at=datetime.now(timezone.utc))
    )
    await session.commit()
