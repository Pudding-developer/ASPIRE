import asyncio
from sqlalchemy import select
from app.core.database import async_session_factory
from app.models.pipeline_models import PipelineJob

async def check_jobs():
    async with async_session_factory() as db:
        result = await db.execute(
            select(PipelineJob).order_by(PipelineJob.started_at.desc()).limit(10)
        )
        jobs = result.scalars().all()
        
        print(f"{'Job ID':<40} | {'Status':<10} | {'Error/Progress'}")
        print("-" * 100)
        for job in jobs:
            error_or_step = job.error or job.current_step or "N/A"
            print(f"{job.id:<40} | {job.status:<10} | {error_or_step[:45]}")

if __name__ == "__main__":
    asyncio.run(check_jobs())
