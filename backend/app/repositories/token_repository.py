from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.instructor_invite_token import InstructorInviteToken


async def get_by_token(db: AsyncSession, token: str) -> InstructorInviteToken | None:
    result = await db.execute(
        select(InstructorInviteToken).where(InstructorInviteToken.token == token)
    )
    return result.scalar_one_or_none()


async def get_by_id(db: AsyncSession, token_id: int) -> InstructorInviteToken | None:
    result = await db.execute(
        select(InstructorInviteToken).where(InstructorInviteToken.id == token_id)
    )
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> InstructorInviteToken:
    invite = InstructorInviteToken(**kwargs)
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


async def consume(db: AsyncSession, token: str, used_by_email: str) -> InstructorInviteToken:
    invite = await get_by_token(db, token)
    if not invite:
        raise ValueError("Token not found")
    invite.is_used = True
    invite.used_by_email = used_by_email
    invite.used_at = datetime.now()
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


async def get_all(db: AsyncSession) -> list[InstructorInviteToken]:
    result = await db.execute(select(InstructorInviteToken))
    return result.scalars().all()


async def delete(db: AsyncSession, token_id: int) -> None:
    invite = await get_by_id(db, token_id)
    if not invite:
        raise ValueError("Token not found")
    await db.delete(invite)
    await db.commit()
