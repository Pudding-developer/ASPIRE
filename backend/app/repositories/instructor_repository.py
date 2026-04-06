from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func

from app.models.instructor import Instructor


async def get_by_id(db: AsyncSession, instructor_id: int) -> Instructor | None:
    result = await db.execute(select(Instructor).where(Instructor.id == instructor_id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> Instructor | None:
    result = await db.execute(select(Instructor).where(Instructor.email == email))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> Instructor:
    instructor = Instructor(**kwargs)
    db.add(instructor)
    await db.commit()
    await db.refresh(instructor)
    return instructor


async def update(db: AsyncSession, instructor_id: int, **kwargs) -> Instructor:
    instructor = await get_by_id(db, instructor_id)
    if not instructor:
        raise ValueError(f"Instructor {instructor_id} not found")
    for key, value in kwargs.items():
        setattr(instructor, key, value)
    db.add(instructor)
    await db.commit()
    await db.refresh(instructor)
    return instructor


async def get_all(db: AsyncSession) -> list[Instructor]:
    result = await db.execute(select(Instructor))
    return result.scalars().all()


async def deactivate(db: AsyncSession, instructor_id: int) -> Instructor:
    return await update(db, instructor_id, is_active=False)


async def activate(db: AsyncSession, instructor_id: int) -> Instructor:
    return await update(db, instructor_id, is_active=True)


async def count_active(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).select_from(Instructor).where(Instructor.is_active == True)  # noqa: E712
    )
    return result.scalar()


async def delete(db: AsyncSession, instructor_id: int) -> None:
    instructor = await get_by_id(db, instructor_id)
    if not instructor:
        raise ValueError(f"Instructor {instructor_id} not found")
    await db.delete(instructor)
    await db.commit()
