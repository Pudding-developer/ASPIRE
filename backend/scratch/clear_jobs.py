import asyncio
from sqlmodel import select, update
from app.core.database import async_session_factory
from app.models.pipeline_models import PipelineJob
from datetime import datetime

async def clear_stale_jobs():
    async with async_session_factory() as session:
        # Mark jobs that are 'running' or 'pending' and older than 1 hour as 'failed'
        # For now, let's just target the specific one or all running/pending ones since this is a dev environment
        statement = select(PipelineJob).where(PipelineJob.status.in_(["pending", "running"]))
        results = await session.execute(statement)
        jobs = results.scalars().all()
        
        for job in jobs:
            print(f"Marking job {job.id} as failed (was {job.status})")
            job.status = "failed"
            job.error = "Job timed out or server restarted."
            job.completed_at = datetime.utcnow()
            session.add(job)
        
        await session.commit()
        print("Done clearing stale jobs.")

if __name__ == "__main__":
    asyncio.run(clear_stale_jobs())
