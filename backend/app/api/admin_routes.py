"""
admin_routes.py — Admin-only management endpoints.

Routes call services only — no direct DB queries or business logic.
"""
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_session
from app.models.admin import Admin
from app.api.deps import get_current_admin
from app.services import admin_service

router = APIRouter()


@router.get("/dashboard")
async def admin_dashboard(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    stats = await admin_service.get_dashboard_stats(session)
    return {"data": stats}


class GenerateTokenRequest(BaseModel):
    assigned_email: Optional[str] = None
    expires_in_hours: int = 48


@router.post("/tokens/generate", status_code=201)
async def generate_invite_token(
    data: GenerateTokenRequest,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    return await admin_service.generate_invite_token(
        session, data.assigned_email, data.expires_in_hours
    )


@router.get("/tokens")
async def list_tokens(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    tokens = await admin_service.list_tokens(session)
    return {"data": tokens}


@router.delete("/tokens/{token_id}", status_code=204)
async def delete_token(
    token_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    await admin_service.delete_token(session, token_id)


@router.get("/instructors")
async def list_instructors(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    instructors = await admin_service.list_instructors(session)
    return {"data": instructors}


@router.patch("/instructors/{instructor_id}/deactivate")
async def deactivate_instructor(
    instructor_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    await admin_service.deactivate_instructor(session, instructor_id)
    return {"data": {}, "message": "Instructor deactivated."}


@router.patch("/instructors/{instructor_id}/activate")
async def activate_instructor(
    instructor_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    await admin_service.activate_instructor(session, instructor_id)
    return {"data": {}, "message": "Instructor activated."}


@router.delete("/instructors/{instructor_id}")
async def remove_instructor(
    instructor_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    await admin_service.remove_instructor(session, instructor_id)
    return {"data": {}, "message": "Instructor role removed. This account no longer has instructor access."}


@router.get("/students")
async def list_students(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    return await admin_service.list_students(session, page, limit, search)


class AssignAdvisorBody(BaseModel):
    advisor_id: Optional[int] = None


@router.put("/students/{student_id}/advisor")
async def assign_advisor(
    student_id: int,
    body: AssignAdvisorBody,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    await admin_service.assign_advisor(session, student_id, body.advisor_id)
    return {"message": "Advisor assigned successfully."}


@router.get("/curriculum")
async def get_curriculum(
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    curricula = await admin_service.get_curricula(session)
    return {"data": curricula}


@router.get("/curriculum/{curriculum_id}/subjects")
async def get_curriculum_subjects(
    curriculum_id: int,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    subjects = await admin_service.get_curriculum_subjects(session, curriculum_id)
    return {"data": subjects}


@router.post("/curriculum/upload")
async def upload_curriculum(
    file: UploadFile = File(...),
    custom_name: Optional[str] = None,
    admin: Admin = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session),
):
    file_bytes = await file.read()
    result = await admin_service.upload_curriculum(session, file_bytes, file.filename, custom_name)
    return {"data": result, "message": "Curriculum uploaded successfully."}



