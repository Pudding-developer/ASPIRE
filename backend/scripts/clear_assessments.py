import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import delete

import app.models
from app.models.class_model import Assessment, AssessmentILO, StudentScore
from app.core.config import DATABASE_URL


async def clear_assessments():
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    SessionFactory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionFactory() as session:
        scores_res = await session.execute(delete(StudentScore))
        ilos_res = await session.execute(delete(AssessmentILO))
        assessments_res = await session.execute(delete(Assessment))

        await session.commit()

        print(f"Deleted {scores_res.rowcount} student_scores")
        print(f"Deleted {ilos_res.rowcount} assessment_ilos")
        print(f"Deleted {assessments_res.rowcount} assessments")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(clear_assessments())
