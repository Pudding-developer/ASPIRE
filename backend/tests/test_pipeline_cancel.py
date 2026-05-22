import asyncio
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.user import User
from app.models.pipeline_models import PipelineJob, CareerReport
from app.api.deps import get_current_student
from app.services import pipeline_service
from main import app

@pytest.fixture
async def seeded_student(session: AsyncSession):
    # Seed a student user
    student = User(
        id=999,
        sr_code="99-99999",
        email="test_student@example.com",
        full_name="Test Student",
        role="student"
    )
    session.add(student)
    await session.commit()
    await session.refresh(student)
    return student

@pytest.fixture
def override_auth(seeded_student):
    async def mock_get_current_student():
        return seeded_student
    app.dependency_overrides[get_current_student] = mock_get_current_student
    yield
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_cancel_pipeline_endpoint(client: AsyncClient, session: AsyncSession, override_auth, seeded_student):
    student_id = seeded_student.id

    # 1. Create a dummy running job in DB and register a dummy asyncio task
    job = PipelineJob(
        id="dummy-job-123",
        student_id=student_id,
        status="running",
        current_step="Analyzing...",
        percentage=20
    )
    session.add(job)
    await session.commit()

    # Create an active dummy task that simulates a running pipeline
    async def dummy_pipeline_task():
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            # Mirror clean-up logic inside run_pipeline_job
            async with pipeline_service._running_tasks["cleanup_session_factory"]() as cleanup_db:
                res = await cleanup_db.execute(
                    select(PipelineJob).where(PipelineJob.id == "dummy-job-123")
                )
                j = res.scalar_one_or_none()
                if j:
                    j.status = "failed"
                    j.error = "Cancelled by user"
                    await cleanup_db.commit()
            raise

    task = asyncio.create_task(dummy_pipeline_task())
    pipeline_service._running_tasks[student_id] = task
    
    # Mock session_factory inside the service module so the task cleanup can find it.
    # We use a mock session factory that yields the existing test session,
    # because sqlite in-memory connections are not shared.
    class MockSessionFactory:
        def __call__(self):
            return self
        async def __aenter__(self):
            return session
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    pipeline_service._running_tasks["cleanup_session_factory"] = MockSessionFactory()

    try:
        # 2. Call the cancel route
        response = await client.post(f"/api/pipeline/cancel/{student_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["cancelled"] is True

        # 3. Wait a brief moment to let the event loop process the cancellation and run the cleanup
        try:
            await asyncio.wait_for(task, timeout=1.0)
        except asyncio.CancelledError:
            pass

        # 4. Check that the task was cancelled
        assert task.cancelled() or task.done()

        # 5. Check database state got updated to failed/cancelled
        # Clear session cache to fetch fresh DB values
        session.expire_all()
        res = await session.execute(
            select(PipelineJob).where(PipelineJob.id == "dummy-job-123")
        )
        updated_job = res.scalar_one()
        assert updated_job.status == "failed"
        assert "cancelled" in updated_job.error.lower()

    finally:
        if not task.done():
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
        pipeline_service._running_tasks.pop(student_id, None)
        pipeline_service._running_tasks.pop("cleanup_session_factory", None)
