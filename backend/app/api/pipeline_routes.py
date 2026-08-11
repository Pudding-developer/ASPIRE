"""
pipeline_routes.py — Endpoints for the AI career-mapping pipeline.
"""
import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session, async_session_factory
from app.core.limiter import limiter
from app.api.deps import get_current_student
from app.models.user import User
from app.services import pipeline_service

router = APIRouter(prefix="/pipeline", tags=["AI Pipeline"])

# Set to retain strong references to background pipeline tasks so GC doesn't drop them
_background_tasks = set()


@router.post("/run/{student_id}", status_code=202)
@limiter.limit("5/hour")
async def run_pipeline(
    request: Request,
    student_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """Launch an AI pipeline run for the given student.

    Pass `?force=true` to bypass the input-hash cache and force the AI crew
    to re-run even when no academic / GitHub data has changed.
    """
    if current_user.id != student_id:
        raise HTTPException(status_code=403, detail="You can only run the pipeline for your own account.")

    running = await pipeline_service.get_running_job(db, student_id)
    if running:
        raise HTTPException(status_code=409, detail="A pipeline job is already running.")

    job = await pipeline_service.create_job(db, student_id)
    task = asyncio.create_task(
        pipeline_service.run_pipeline_job(job.id, student_id, async_session_factory, force=force)
    )
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)
    return {"data": {"job_id": job.id, "message": "Pipeline started."}}


@router.post("/cancel/{student_id}")
async def cancel_pipeline(
    student_id: int,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """Cancel the active pipeline job for the student."""
    if current_user.id != student_id:
        raise HTTPException(status_code=403, detail="You can only cancel your own pipeline run.")

    cancelled = await pipeline_service.cancel_running_job(db, student_id)
    return {"data": {"cancelled": cancelled}}


@router.get("/status/{job_id}")
async def pipeline_status(
    job_id: str,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """Poll the status of a pipeline job."""
    job = await pipeline_service.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Pipeline job not found.")
    if job.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    return {"data": {
        "job_id": job.id,
        "status": job.status,
        "current_step": job.current_step,
        "percentage": job.percentage,
        "error": job.error,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }}


@router.get("/report/{student_id}")
async def get_report(
    student_id: int,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """Get the latest career report for a student."""
    if current_user.id != student_id:
        raise HTTPException(status_code=403, detail="You can only view your own reports.")

    report = await pipeline_service.get_latest_report(db, student_id)
    if not report:
        raise HTTPException(status_code=404, detail="No career report found. Run the pipeline first.")

    return JSONResponse(
        content={"data": {
            "id": report.id,
            "student_id": report.student_id,
            "job_id": report.job_id,
            "report": json.loads(report.report_json),
            "summary": report.summary,
            "created_at": report.created_at.isoformat() + "Z",
        }},
        headers={"Cache-Control": "no-store"},
    )


@router.get("/reports/{student_id}")
async def get_all_reports(
    student_id: int,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """Get all career reports for a student (most recent first)."""
    if current_user.id != student_id:
        raise HTTPException(status_code=403, detail="You can only view your own reports.")

    reports = await pipeline_service.get_all_reports(db, student_id)
    return JSONResponse(
        content={"data": [
            {
                "id": r.id,
                "student_id": r.student_id,
                "job_id": r.job_id,
                "report": json.loads(r.report_json),
                "summary": r.summary,
                "created_at": r.created_at.isoformat() + "Z",
            }
            for r in reports
        ]},
        headers={"Cache-Control": "no-store"},
    )
