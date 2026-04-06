"""
github_routes.py — GitHub OAuth connection + analysis endpoints.

Routes call services only — no direct DB queries or business logic.
"""
import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session, async_session_factory
from app.api.deps import get_current_student
from app.models.user import User
from app.repositories import github_repository
from app.services.github_service import (
    build_github_auth_url,
    validate_and_pop_state,
    exchange_code_for_token,
    fetch_github_user,
    connect_github_account,
    get_summary,
    get_repositories,
    get_contribution_data,
    run_analysis,
)

router = APIRouter()


@router.get("/connect")
async def github_connect(current_user: User = Depends(get_current_student)):
    auth_url = build_github_auth_url(current_user.id)
    return {"data": {"auth_url": auth_url}}


@router.get("/callback")
async def github_callback(code: str, state: str, response: Response, db: AsyncSession = Depends(get_session)):
    user_id = validate_and_pop_state(state)
    if user_id is None:
        raise HTTPException(status_code=403, detail="Invalid or expired OAuth state.")

    access_token = await exchange_code_for_token(code)
    gh_user = await fetch_github_user(access_token)
    data, is_new = await connect_github_account(db, user_id, gh_user, access_token)

    response.status_code = 201 if is_new else 200
    return {"data": data, "message": "GitHub account connected successfully."}


@router.get("/status")
async def github_status(current_user: User = Depends(get_current_student), db: AsyncSession = Depends(get_session)):
    profile = await github_repository.get_profile(db, current_user.id)
    if not profile:
        return {"data": {"connected": False, "github_username": None, "github_avatar_url": None, "last_analyzed": None, "has_analysis": False}}
    return {"data": {
        "connected": True,
        "github_username": profile.github_username,
        "github_avatar_url": profile.github_avatar_url,
        "last_analyzed": profile.last_analyzed.isoformat() if profile.last_analyzed else None,
        "has_analysis": profile.last_analyzed is not None,
    }}


@router.delete("/disconnect", status_code=204)
async def github_disconnect(current_user: User = Depends(get_current_student), db: AsyncSession = Depends(get_session)):
    profile = await github_repository.get_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="GitHub account is not connected.")
    await github_repository.delete_repos(db, current_user.id)
    await github_repository.delete_contributions(db, current_user.id)
    await github_repository.delete_profile(db, current_user.id)


@router.post("/analyze", status_code=202)
async def github_analyze(current_user: User = Depends(get_current_student), db: AsyncSession = Depends(get_session)):
    profile = await github_repository.get_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="GitHub account is not connected.")

    running = await github_repository.get_running_job(db, current_user.id)
    if running:
        raise HTTPException(status_code=409, detail="An analysis is already running.")

    job_id = str(uuid.uuid4())
    await github_repository.create_job(db, job_id, current_user.id)
    asyncio.create_task(run_analysis(job_id, current_user.id, async_session_factory))
    return {"data": {"job_id": job_id, "message": "Analysis started."}}


@router.get("/analyze/status/{job_id}")
async def github_analyze_status(
    job_id: str,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    job = await github_repository.get_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found.")
    if job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return {"data": {
        "status": job.status, "current_step": job.current_step,
        "current_step_label": job.current_step_label, "percentage": job.percentage,
        "error": job.error,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    }}


@router.get("/summary")
async def github_summary(current_user: User = Depends(get_current_student), db: AsyncSession = Depends(get_session)):
    data, cached_at = await get_summary(db, current_user.id)
    if data is None:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return {"data": data, "cached_at": cached_at}


@router.get("/repositories")
async def github_repositories(current_user: User = Depends(get_current_student), db: AsyncSession = Depends(get_session)):
    data, cached_at = await get_repositories(db, current_user.id)
    if data is None:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return {"data": data, "cached_at": cached_at}


@router.get("/contributions")
async def github_contributions(current_user: User = Depends(get_current_student), db: AsyncSession = Depends(get_session)):
    data, cached_at = await get_contribution_data(db, current_user.id)
    if data is None:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return {"data": data, "cached_at": cached_at}
