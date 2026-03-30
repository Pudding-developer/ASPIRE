"""
admin_routes.py — Admin-only management endpoints.

All routes protected by get_current_admin dependency.

Routes:
  GET    /admin/dashboard
  POST   /admin/tokens/generate
  GET    /admin/tokens
  DELETE /admin/tokens/{token_id}
  GET    /admin/instructors
  PATCH  /admin/instructors/{instructor_id}/deactivate
  PATCH  /admin/instructors/{instructor_id}/activate
  DELETE /admin/instructors/{instructor_id}
  GET    /admin/students
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
from pydantic import BaseModel

from app.core.database import get_session
from app.models.user import User
from app.models.instructor import Instructor
from app.models.instructor_invite_token import InstructorInviteToken
from app.models.admin import Admin
from app.api.deps import get_current_admin
from app.services.email_service import send_instructor_invite

router = APIRouter()

FRONTEND_BASE_URL = "http://localhost:5173"


# ---------------------------------------------------------------------------
# GET /admin/dashboard
# ---------------------------------------------------------------------------

@router.get("/dashboard")
async def admin_dashboard(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    now = datetime.now()

    total_instructors = (await session.execute(select(func.count()).select_from(Instructor))).scalar()
    total_students = (await session.execute(select(func.count()).select_from(User))).scalar()

    all_tokens = (await session.execute(select(InstructorInviteToken))).scalars().all()
    total_tokens = len(all_tokens)
    used = sum(1 for t in all_tokens if t.is_used)
    expired = sum(1 for t in all_tokens if not t.is_used and t.expires_at < now)
    pending = total_tokens - used - expired

    return {
        "data": {
            "total_instructors": total_instructors,
            "total_students": total_students,
            "total_tokens_generated": total_tokens,
            "total_tokens_used": used,
            "total_tokens_pending": pending,
            "total_tokens_expired": expired,
        }
    }


# ---------------------------------------------------------------------------
# POST /admin/tokens/generate
# ---------------------------------------------------------------------------

class GenerateTokenRequest(BaseModel):
    assigned_email: Optional[str] = None
    expires_in_hours: int = 48


@router.post("/tokens/generate", status_code=status.HTTP_201_CREATED)
async def generate_invite_token(
    data: GenerateTokenRequest,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(hours=data.expires_in_hours)

    invite = InstructorInviteToken(
        token=token_value,
        assigned_email=data.assigned_email,
        expires_at=expires_at,
    )
    session.add(invite)
    await session.commit()
    await session.refresh(invite)

    invite_link = f"{FRONTEND_BASE_URL}/instructor/register?token={token_value}"

    email_sent = False
    if data.assigned_email:
        expires_str = expires_at.strftime("%B %d, %Y at %I:%M %p")
        email_sent = await send_instructor_invite(data.assigned_email, invite_link, token_value, expires_str)

    if data.assigned_email:
        message = f"Invite sent to {data.assigned_email}" if email_sent else "Token created but email failed. Copy the link manually."
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


# ---------------------------------------------------------------------------
# GET /admin/tokens
# ---------------------------------------------------------------------------

def _token_status(token: InstructorInviteToken) -> str:
    if token.is_used:
        return "used"
    if token.expires_at < datetime.now():
        return "expired"
    return "pending"


@router.get("/tokens")
async def list_tokens(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    tokens = (await session.execute(select(InstructorInviteToken))).scalars().all()
    return {
        "data": [
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
    }


# ---------------------------------------------------------------------------
# DELETE /admin/tokens/{token_id}
# ---------------------------------------------------------------------------

@router.delete("/tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_token(
    token_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(InstructorInviteToken).where(InstructorInviteToken.id == token_id)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Token not found.")
    if invite.is_used:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a used token.",
            headers={"X-Error-Code": "TOKEN_ALREADY_USED"},
        )
    await session.delete(invite)
    await session.commit()


# ---------------------------------------------------------------------------
# GET /admin/instructors
# ---------------------------------------------------------------------------

@router.get("/instructors")
async def list_instructors(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    instructors = (await session.execute(select(Instructor))).scalars().all()
    return {
        "data": [
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
    }


# ---------------------------------------------------------------------------
# PATCH /admin/instructors/{instructor_id}/deactivate
# ---------------------------------------------------------------------------

@router.patch("/instructors/{instructor_id}/deactivate")
async def deactivate_instructor(
    instructor_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Instructor).where(Instructor.id == instructor_id))
    instructor = result.scalar_one_or_none()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")
    instructor.is_active = False
    session.add(instructor)
    await session.commit()
    return {"data": {}, "message": "Instructor deactivated."}


# ---------------------------------------------------------------------------
# PATCH /admin/instructors/{instructor_id}/activate
# ---------------------------------------------------------------------------

@router.patch("/instructors/{instructor_id}/activate")
async def activate_instructor(
    instructor_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Instructor).where(Instructor.id == instructor_id))
    instructor = result.scalar_one_or_none()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")
    instructor.is_active = True
    session.add(instructor)
    await session.commit()
    return {"data": {}, "message": "Instructor activated."}


# ---------------------------------------------------------------------------
# DELETE /admin/instructors/{instructor_id} — permanently remove instructor role
# ---------------------------------------------------------------------------

@router.delete("/instructors/{instructor_id}")
async def remove_instructor(
    instructor_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    """
    Permanently deletes the instructor record. After deletion the account no longer
    has instructor access — if they log in via Google the callback will not find
    them in the instructor table and will fall through to ACCOUNT_NOT_FOUND.
    """
    result = await session.execute(select(Instructor).where(Instructor.id == instructor_id))
    instructor = result.scalar_one_or_none()
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")

    # Guard: never remove the last active instructor
    if instructor.is_active:
        active_count = (await session.execute(
            select(func.count()).select_from(Instructor).where(Instructor.is_active == True)  # noqa: E712
        )).scalar()
        if active_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the only active instructor.",
                headers={"X-Error-Code": "LAST_INSTRUCTOR"},
            )

    await session.delete(instructor)
    await session.commit()
    return {
        "data": {},
        "message": "Instructor role removed. This account no longer has instructor access.",
    }


# ---------------------------------------------------------------------------
# GET /admin/students — paginated
# ---------------------------------------------------------------------------

@router.get("/students")
async def list_students(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    offset = (page - 1) * limit
    total = (await session.execute(select(func.count()).select_from(User))).scalar()
    students = (
        await session.execute(select(User).offset(offset).limit(limit))
    ).scalars().all()

    return {
        "data": {
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
    }
