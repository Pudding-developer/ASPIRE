"""
instructor_class_routes.py — Instructor class management endpoints.

Routes call services only — no direct DB queries or business logic.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.api.deps import get_current_instructor
from app.models.instructor import Instructor
from app.schemas.class_schema import ClassCreate, ClassOut, DashboardStats, AssessmentBatchSubmit
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


@router.get("/api/instructor/classes/{class_id}/students")
async def get_class_students(
    class_id: int,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    students = await class_service.get_class_students(session, instructor.id, class_id)
    return {"data": students}


@router.post("/api/instructor/classes/{class_id}/assessments/submit", status_code=201)
async def submit_assessment(
    class_id: int,
    data: AssessmentBatchSubmit,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    await class_service.submit_assessment_scores(session, instructor.id, class_id, data)
    return {"data": {}, "message": "Scores submitted successfully."}


@router.get("/api/instructor/classes/{class_id}/assessments")
async def get_assessments(
    class_id: int,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    assessments = await class_service.get_class_assessments(session, instructor.id, class_id)
    return {"data": assessments}


@router.get("/api/instructor/classes/{class_id}/assessments/{assessment_id}")
async def get_assessment_detail(
    class_id: int,
    assessment_id: int,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    details = await class_service.get_class_assessment_detail(
        session, instructor.id, class_id, assessment_id
    )
    return {"data": details}


@router.put("/api/instructor/classes/{class_id}/assessments/{assessment_id}")
async def update_assessment(
    class_id: int,
    assessment_id: int,
    data: AssessmentBatchSubmit,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    await class_service.update_assessment_scores(
        session, instructor.id, class_id, assessment_id, data
    )
    return {"data": {}, "message": "Assessment updated successfully."}


@router.delete("/api/instructor/classes/{class_id}/assessments/{assessment_id}")
async def delete_assessment(
    class_id: int,
    assessment_id: int,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    await class_service.delete_assessment(
        session, instructor.id, class_id, assessment_id
    )
    return {"data": {}, "message": "Assessment deleted successfully."}


@router.get("/api/instructor/classes/{class_id}/students/{student_id}/dashboard")
async def get_student_dashboard(
    class_id: int,
    student_id: int,
    instructor: Instructor = Depends(get_current_instructor),
    session: AsyncSession = Depends(get_session),
):
    """
    Per-course ASPIRE report for one student in one of the instructor's classes.
    Same JSON shape as GET /api/student/dashboard.
    """
    report = await class_service.get_student_course_dashboard(
        session, instructor.id, class_id, student_id
    )
    return {"data": report}
