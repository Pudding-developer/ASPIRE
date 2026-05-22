import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlalchemy import delete

import app.models
from app.models.user import User
from app.models.class_model import ClassEnrollment
from app.core.config import DATABASE_URL

TARGET_SR_CODE = "22-09172"


async def unenroll():
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    SessionFactory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionFactory() as session:
        result = await session.execute(select(User).where(User.sr_code == TARGET_SR_CODE))
        user = result.scalar_one_or_none()

        if not user:
            print(f"No user found with sr_code={TARGET_SR_CODE}")
            await engine.dispose()
            return

        del_res = await session.execute(
            delete(ClassEnrollment).where(ClassEnrollment.student_id == user.id)
        )
        await session.commit()

        print(f"Unenrolled {user.sr_code} ({user.full_name}) from {del_res.rowcount} class(es)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(unenroll())
