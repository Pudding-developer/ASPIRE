import asyncio
from sqlmodel import create_engine, select
from app.models.pipeline_models import PipelineJob
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine("postgresql+asyncpg://aspire_user:aspire123@localhost/aspire_db")

async def main():
    async with AsyncSession(engine) as session:
        result = await session.execute(select(PipelineJob).order_by(PipelineJob.started_at.desc()).limit(1))
        job = result.scalar_one_or_none()
        if job:
            print("Status:", job.status)
            print("Error Details:", job.error)
        else:
            print("No jobs found")

asyncio.run(main())
