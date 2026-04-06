"""
instructor_class_routes.py — Instructor class management endpoints.

Routes call services only — no direct DB queries or business logic.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_instructor
from app.models.instructor import Instructor
from app.schemas.class_schema import ClassCreate, ClassOut, DashboardStats
from app.services import class_service

router = APIRouter()


@router.get("/api/instructor/classes", response_model=list[ClassOut])
async def list_classes(
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    return await class_service.get_instructor_classes(session, instructor.id)


@router.post("/api/instructor/classes", response_model=ClassOut, status_code=201)
async def create_class(
    data: ClassCreate,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    return await class_service.create_class(session, instructor.id, data)


@router.get("/api/instructor/classes/archived", response_model=list[ClassOut])
async def list_archived(
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    return await class_service.get_archived_classes(session, instructor.id)


@router.patch("/api/instructor/classes/{class_id}/archive")
async def archive_class(
    class_id: int,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    await class_service.archive_class(session, instructor.id, class_id)
    return {"data": {}, "message": "Class archived."}


@router.delete("/api/instructor/classes/{class_id}", status_code=204)
async def delete_class(
    class_id: int,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    await class_service.delete_class(session, instructor.id, class_id)


@router.get("/api/instructor/dashboard", response_model=DashboardStats)
async def instructor_dashboard(
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    return await class_service.get_dashboard_stats(session, instructor.id)
