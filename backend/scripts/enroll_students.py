import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select

import app.models
from app.models.user import User
from app.models.class_model import Class, ClassEnrollment
from app.core.config import DATABASE_URL

async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    SessionFactory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionFactory() as session:
        # Get all classes
        classes_result = await session.execute(select(Class))
        all_classes = classes_result.scalars().all()

        if not all_classes:
            print("No classes found in the database. Cannot enroll students.")
            await engine.dispose()
            return

        # Get all students
        students_result = await session.execute(select(User).where(User.role == "student"))
        all_students = students_result.scalars().all()

        if not all_students:
            print("No students found in the database.")
            await engine.dispose()
            return

        enrolled_count = 0
        
        for student in all_students:
            for c in all_classes:
                # Check if already enrolled
                check_result = await session.execute(
                    select(ClassEnrollment)
                    .where(ClassEnrollment.class_id == c.id)
                    .where(ClassEnrollment.student_id == student.id)
                )
                if not check_result.scalar_one_or_none():
                    enrollment = ClassEnrollment(
                        class_id=c.id,
                        student_id=student.id
                    )
                    session.add(enrollment)
                    enrolled_count += 1

        await session.commit()
        print(f"Successfully enrolled {len(all_students)} students into {len(all_classes)} classes.")
        print(f"Created {enrolled_count} new enrollment records.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
