from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.user import User


async def get_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_by_sr_code(db: AsyncSession, sr_code: str) -> User | None:
    result = await db.execute(select(User).where(User.sr_code == sr_code))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, **kwargs) -> User:
    user = User(**kwargs)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update(db: AsyncSession, user_id: int, **kwargs) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError(f"User {user_id} not found")
    for key, value in kwargs.items():
        setattr(user, key, value)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_students_paginated(
    db: AsyncSession,
    page: int = 1,
    limit: int = 10,
    search: str | None = None
) -> tuple[list[User], int]:
    offset = (page - 1) * limit
    query = select(User).where(User.role == "student")
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                User.full_name.ilike(search_filter),
                User.email.ilike(search_filter),
                User.sr_code.ilike(search_filter),
                User.chosen_career.ilike(search_filter)
            )
        )
        
    count_query = select(func.count()).select_from(query.subquery())
    total_count = (await db.execute(count_query)).scalar() or 0
    
    query = query.order_by(User.full_name.asc()).offset(offset).limit(limit)
    result = await db.execute(query)
    students = result.scalars().all()
    
    return list(students), total_count

