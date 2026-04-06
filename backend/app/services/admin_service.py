"""
admin_service.py — Admin business logic for dashboard, token management,
instructor management, and student listing.
"""
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import admin_repository, token_repository, instructor_repository, user_repository
from app.services.email_service import send_instructor_invite

FRONTEND_BASE_URL = "http://localhost:5173"


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

async def get_dashboard_stats(db: AsyncSession) -> dict:
    return await admin_repository.get_stats(db)


# ---------------------------------------------------------------------------
# Token management
# ---------------------------------------------------------------------------

def _token_status(token) -> str:
    if token.is_used:
        return "used"
    if token.expires_at < datetime.now():
        return "expired"
    return "pending"


async def generate_invite_token(
    db: AsyncSession,
    assigned_email: str | None = None,
    expires_in_hours: int = 48,
) -> dict:
    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(hours=expires_in_hours)

    invite = await token_repository.create(
        db,
        token=token_value,
        assigned_email=assigned_email,
        expires_at=expires_at,
    )

    invite_link = f"{FRONTEND_BASE_URL}/instructor/register?token={token_value}"

    email_sent = False
    if assigned_email:
        expires_str = expires_at.strftime("%B %d, %Y at %I:%M %p")
        email_sent = await send_instructor_invite(assigned_email, invite_link, token_value, expires_str)

    if assigned_email:
        message = f"Invite sent to {assigned_email}" if email_sent else "Token created but email failed. Copy the link manually."
    else:
        message = "Copy this link now. The token will not be shown again."

    return {
        "data": {
            "token": token_value,
            "invite_link": invite_link,
            "assigned_email": invite.assigned_email,
            "expires_at": invite.expires_at.isoformat(),
            "email_sent": email_sent,
        },
        "message": message,
    }


async def list_tokens(db: AsyncSession) -> list[dict]:
    tokens = await token_repository.get_all(db)
    return [
        {
            "id": t.id,
            "token": t.token,
            "assigned_email": t.assigned_email,
            "status": _token_status(t),
            "used_by_email": t.used_by_email,
            "used_at": t.used_at.isoformat() if t.used_at else None,
            "expires_at": t.expires_at.isoformat(),
            "created_at": t.created_at.isoformat(),
        }
        for t in tokens
    ]


async def delete_token(db: AsyncSession, token_id: int) -> None:
    invite = await token_repository.get_by_id(db, token_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Token not found.")
    if invite.is_used:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a used token.",
            headers={"X-Error-Code": "TOKEN_ALREADY_USED"},
        )
    await token_repository.delete(db, token_id)


# ---------------------------------------------------------------------------
# Instructor management
# ---------------------------------------------------------------------------

async def list_instructors(db: AsyncSession) -> list[dict]:
    instructors = await instructor_repository.get_all(db)
    return [
        {
            "id": i.id,
            "email": i.email,
            "full_name": i.full_name,
            "avatar_url": i.avatar_url,
            "is_active": i.is_active,
            "created_at": i.created_at.isoformat(),
        }
        for i in instructors
    ]


async def deactivate_instructor(db: AsyncSession, instructor_id: int) -> None:
    instructor = await instructor_repository.get_by_id(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")
    await instructor_repository.deactivate(db, instructor_id)


async def activate_instructor(db: AsyncSession, instructor_id: int) -> None:
    instructor = await instructor_repository.get_by_id(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")
    await instructor_repository.activate(db, instructor_id)


async def remove_instructor(db: AsyncSession, instructor_id: int) -> None:
    instructor = await instructor_repository.get_by_id(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")

    if instructor.is_active:
        active_count = await instructor_repository.count_active(db)
        if active_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the only active instructor.",
                headers={"X-Error-Code": "LAST_INSTRUCTOR"},
            )

    await instructor_repository.delete(db, instructor_id)


# ---------------------------------------------------------------------------
# Student listing
# ---------------------------------------------------------------------------

async def list_students(db: AsyncSession, page: int = 1, limit: int = 20) -> dict:
    students, total = await user_repository.get_all(db, page, limit)
    return {
        "students": [
            {
                "id": s.id,
                "email": s.email,
                "sr_code": s.sr_code,
                "full_name": s.full_name,
                "avatar_url": s.avatar_url,
                "created_at": s.created_at.isoformat() if hasattr(s, "created_at") and s.created_at else None,
            }
            for s in students
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }
