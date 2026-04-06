"""
instructor_auth_routes.py — Token-gated instructor registration endpoints.

Routes call services only — no direct DB queries.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.repositories import token_repository

router = APIRouter()


@router.get("/register")
async def validate_invite_token(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    invite = await token_repository.get_by_token(session, token)
    if not invite or invite.is_used or invite.expires_at < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired invitation link.",
            headers={"X-Error-Code": "INVALID_TOKEN"},
        )
    return {"data": {"valid": True, "assigned_email": invite.assigned_email}}
