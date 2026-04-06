from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func

from app.models.admin import Admin
from app.models.instructor import Instructor
from app.models.user import User
from app.models.instructor_invite_token import InstructorInviteToken


async def get_by_id(db: AsyncSession, admin_id: int) -> Admin | None:
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> Admin | None:
    result = await db.execute(select(Admin).where(Admin.email == email))
    return result.scalar_one_or_none()


async def get_stats(db: AsyncSession) -> dict:
    now = datetime.now()
    total_instructors = (await db.execute(select(func.count()).select_from(Instructor))).scalar()
    total_students = (await db.execute(select(func.count()).select_from(User))).scalar()

    all_tokens = (await db.execute(select(InstructorInviteToken))).scalars().all()
    total_tokens = len(all_tokens)
    used = sum(1 for t in all_tokens if t.is_used)
    expired = sum(1 for t in all_tokens if not t.is_used and t.expires_at < now)
    pending = total_tokens - used - expired

    return {
        "total_instructors": total_instructors,
        "total_students": total_students,
        "total_tokens_generated": total_tokens,
        "total_tokens_used": used,
        "total_tokens_pending": pending,
        "total_tokens_expired": expired,
    }
