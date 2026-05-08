from fastapi import Depends, HTTPException, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.core.security import create_access_token, verify_access_token
from app.models.user import User
from app.models.instructor import Instructor
from app.models.admin import Admin

security_scheme = HTTPBearer()


def _extract_payload(credentials: HTTPAuthorizationCredentials, response: Response | None = None):
    token = credentials.credentials
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("user_id") or payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token payload missing user ID.")

    if response is not None:
        refresh_payload = {k: v for k, v in payload.items() if k != "exp"}
        response.headers["X-Refresh-Token"] = create_access_token(refresh_payload)

    return payload, int(user_id)


# ---------------------------------------------------------------------------
# Student dependency
# ---------------------------------------------------------------------------

async def get_current_student(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Verifies JWT and queries the user table. Never trusts role from token alone."""
    payload, user_id = _extract_payload(credentials, response)
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required.",
            headers={"X-Error-Code": "STUDENT_REQUIRED"},
        )
    return user


# ---------------------------------------------------------------------------
# Instructor dependency
# ---------------------------------------------------------------------------

async def get_current_instructor(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
) -> Instructor:
    """Verifies JWT and queries the instructor table."""
    payload, user_id = _extract_payload(credentials, response)
    result = await session.execute(select(Instructor).where(Instructor.id == user_id))
    instructor = result.scalar_one_or_none()
    if instructor is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor access required.",
            headers={"X-Error-Code": "INSTRUCTOR_REQUIRED"},
        )
    if not instructor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your instructor account has been deactivated.",
            headers={"X-Error-Code": "INSTRUCTOR_DEACTIVATED"},
        )
    return instructor


# ---------------------------------------------------------------------------
# Admin dependency
# ---------------------------------------------------------------------------

async def get_current_admin(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
) -> Admin:
    """Verifies JWT and queries the admin table."""
    payload, user_id = _extract_payload(credentials, response)
    result = await session.execute(select(Admin).where(Admin.id == user_id))
    admin = result.scalar_one_or_none()
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
            headers={"X-Error-Code": "ADMIN_REQUIRED"},
        )
    return admin


# ---------------------------------------------------------------------------
# Legacy: get_current_user (kept for backwards compatibility)
# ---------------------------------------------------------------------------

async def get_current_user(
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    return await get_current_student(response=response, credentials=credentials, session=session)


def require_role(required_role: str):
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This route requires the '{required_role}' role.",
            )
        return user
    return role_checker
