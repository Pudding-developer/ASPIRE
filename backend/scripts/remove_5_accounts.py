import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select

import app.models
from app.models.user import User
from app.models.class_model import ClassEnrollment, StudentScore
from app.models.pipeline_models import PipelineJob, CareerReport
from app.models.chat import ChatSession, ChatMessage
from app.core.config import DATABASE_URL

async def remove_users():
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    SessionFactory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    target_sr_codes = ["22-07435", "99-99999", "22-00458", "22-06969", "20-05845"]

    async with SessionFactory() as session:
        result = await session.execute(select(User).where(User.sr_code.in_(target_sr_codes)))
        users_to_delete = result.scalars().all()
        
        if not users_to_delete:
            print("No matching users found.")
            await engine.dispose()
            return
            
        for u in users_to_delete:
            print(f"Deleting user: {u.sr_code} | {u.full_name}")
            
            # Delete enrollments
            enrollments = await session.execute(select(ClassEnrollment).where(ClassEnrollment.student_id == u.id))
            for e in enrollments.scalars().all():
                await session.delete(e)
                
            # Delete scores
            scores = await session.execute(select(StudentScore).where(StudentScore.student_id == u.id))
            for s in scores.scalars().all():
                await session.delete(s)

            # Delete Chat Sessions (and cascade delete messages)
            chats = await session.execute(select(ChatSession).where(ChatSession.student_id == u.id))
            for c in chats.scalars().all():
                # Let's delete chat messages explicitly to be safe
                msgs = await session.execute(select(ChatMessage).where(ChatMessage.session_id == c.id))
                for m in msgs.scalars().all():
                    await session.delete(m)
                await session.delete(c)

            # Delete Career Reports
            reports = await session.execute(select(CareerReport).where(CareerReport.student_id == u.id))
            for r in reports.scalars().all():
                await session.delete(r)

            # Delete Pipeline Jobs
            jobs = await session.execute(select(PipelineJob).where(PipelineJob.student_id == u.id))
            for j in jobs.scalars().all():
                await session.delete(j)
                
            # Now delete user
            await session.delete(u)
            
        await session.commit()
        print(f"Deleted {len(users_to_delete)} users and their related records.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(remove_users())
