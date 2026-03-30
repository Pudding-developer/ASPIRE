"""
instructor_auth_routes.py — Token-gated instructor registration endpoints.

Routes:
  GET  /instructor/register?token=  — validate invite token

Note: POST /instructor/register has been removed.
Instructors are registered exclusively via Google OAuth (flow=instructor_register).
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.models.instructor_invite_token import InstructorInviteToken

router = APIRouter()

INVALID_TOKEN_RESPONSE = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Invalid or expired invitation link.",
    headers={"X-Error-Code": "INVALID_TOKEN"},
)


async def _get_valid_token(token: str, session: AsyncSession) -> InstructorInviteToken:
    """
    Shared validation: token exists, not used, not expired. Always 403 on failure.

    One-time-use invariant:
      - is_used=True means the token was already consumed; it can NEVER be reused,
        re-registered, or transferred to another account under any circumstance.
      - We deliberately return the same generic 403 INVALID_TOKEN for used, expired,
        and not-found cases — callers must not be told which condition triggered.
    """
    result = await session.execute(
        select(InstructorInviteToken).where(InstructorInviteToken.token == token)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise INVALID_TOKEN_RESPONSE
    # Permanently blocked — never reveal it was 'used' vs 'not found'
    if invite.is_used:
        raise INVALID_TOKEN_RESPONSE
    if invite.expires_at < datetime.now():
        raise INVALID_TOKEN_RESPONSE
    return invite


# ---------------------------------------------------------------------------
# GET /instructor/register?token=
# ---------------------------------------------------------------------------

@router.get("/register")
async def validate_invite_token(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    invite = await _get_valid_token(token, session)
    return {
        "data": {
            "valid": True,
            "assigned_email": invite.assigned_email,
        }
    }
