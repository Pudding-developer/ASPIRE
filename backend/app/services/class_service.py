"""
class_service.py — Business logic for class management.
"""
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import class_repository
from app.schemas.class_schema import ClassCreate, ClassOut, DashboardStats


def _get_school_year() -> str:
    now = datetime.utcnow()
    if now.month >= 8:
        return f"{now.year}-{now.year + 1}"
    return f"{now.year - 1}-{now.year}"


async def _to_class_out(session: AsyncSession, cls) -> ClassOut:
    count = await class_repository.get_student_count(session, cls.id)
    return ClassOut(
        id=cls.id,
        subject_name=cls.subject_name,
        course_code=cls.course_code,
        year_level=cls.year_level,
        semester=cls.semester,
        section=cls.section,
        class_code=cls.class_code,
        is_archived=cls.is_archived,
        student_count=count,
        created_at=cls.created_at,
    )


async def get_instructor_classes(session: AsyncSession, instructor_id: int) -> list[ClassOut]:
    classes = await class_repository.get_classes_by_instructor(session, instructor_id)
    return [await _to_class_out(session, c) for c in classes]


async def get_archived_classes(session: AsyncSession, instructor_id: int) -> list[ClassOut]:
    classes = await class_repository.get_archived_by_instructor(session, instructor_id)
    return [await _to_class_out(session, c) for c in classes]


async def create_class(session: AsyncSession, instructor_id: int, data: ClassCreate) -> ClassOut:
    cls = await class_repository.create_class(session, instructor_id, data)
    return await _to_class_out(session, cls)


async def _verify_ownership(session: AsyncSession, instructor_id: int, class_id: int):
    cls = await class_repository.get_class_by_id(session, class_id)
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")
    if cls.instructor_id != instructor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this class.")
    return cls


async def archive_class(session: AsyncSession, instructor_id: int, class_id: int) -> None:
    await _verify_ownership(session, instructor_id, class_id)
    await class_repository.archive_class(session, class_id)


async def delete_class(session: AsyncSession, instructor_id: int, class_id: int) -> None:
    await _verify_ownership(session, instructor_id, class_id)
    await class_repository.delete_class(session, class_id)


async def get_dashboard_stats(session: AsyncSession, instructor_id: int) -> DashboardStats:
    stats = await class_repository.get_dashboard_stats(session, instructor_id)
    return DashboardStats(
        total_students=stats["total_students"],
        active_courses=stats["active_courses"],
        school_year=_get_school_year(),
        avg_performance=stats["avg_performance"],
    )
