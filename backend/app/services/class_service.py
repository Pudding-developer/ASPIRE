"""
class_service.py — Business logic for class management.
"""
import asyncio
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.repositories import class_repository
from app.schemas.class_schema import ClassCreate, ClassOut, DashboardStats, AssessmentBatchSubmit, AssessmentSummary, AssessmentBatchDetail
from app.models.class_model import Assessment, AssessmentILO, ClassEnrollment, StudentScore
from app.models.user import User
from app.services import activity_service


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


async def restore_class(session: AsyncSession, instructor_id: int, class_id: int) -> None:
    await _verify_ownership(session, instructor_id, class_id)
    await class_repository.restore_class(session, class_id)


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


async def get_class_students(
    session: AsyncSession,
    instructor_id: int,
    class_id: int,
) -> list[dict[str, object | None]]:
    await _verify_ownership(session, instructor_id, class_id)
    return await class_repository.get_students_by_class(session, class_id)


async def submit_assessment_scores(
    session: AsyncSession,
    instructor_id: int,
    class_id: int,
    data: AssessmentBatchSubmit,
) -> None:
    cls = await _verify_ownership(session, instructor_id, class_id)

    # 1. Create Assessment
    assessment = Assessment(
        class_id=class_id,
        name=data.name,
        type=data.type,
    )
    session.add(assessment)
    await session.flush()  # to get assessment.id

    # 2. Create AssessmentILOs
    ilo_records = {} # ilo_number -> id
    for ilo_number, max_score in data.ilos.items():
        ilo = AssessmentILO(
            assessment_id=assessment.id,
            ilo_number=ilo_number,
            max_score=max_score,
        )
        session.add(ilo)
        await session.flush()
        ilo_records[ilo_number] = ilo.id

    # 3. Create StudentScores
    scored_student_ids: set[int] = set()
    for student_id, scores in data.scores.items():
        for ilo_number, score_val in scores.items():
            if ilo_number in ilo_records:
                student_score = StudentScore(
                    assessment_id=assessment.id,
                    ilo_id=ilo_records[ilo_number],
                    student_id=student_id,
                    score=score_val,
                )
                session.add(student_score)
                scored_student_ids.add(student_id)

    await activity_service.emit_grade_released(
        session,
        student_ids=list(scored_student_ids),
        subject_name=cls.subject_name,
        assessment_name=data.name,
        class_id=class_id,
        assessment_id=assessment.id,
    )

    await session.commit()


async def get_class_assessments(
    session: AsyncSession, instructor_id: int, class_id: int
) -> list[AssessmentSummary]:
    await _verify_ownership(session, instructor_id, class_id)
    assessments = await class_repository.get_assessments_by_class(session, class_id)
    return [
        AssessmentSummary(
            id=a.id, name=a.name, type=a.type, created_at=a.created_at
        )
        for a in assessments
    ]


async def get_class_assessment_detail(
    session: AsyncSession, instructor_id: int, class_id: int, assessment_id: int
) -> AssessmentBatchDetail:
    await _verify_ownership(session, instructor_id, class_id)
    assessment = await class_repository.get_assessment_by_id(session, assessment_id)
    if not assessment or assessment.class_id != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    ilos = await class_repository.get_assessment_ilos(session, assessment_id)
    student_scores = await class_repository.get_student_scores(session, assessment_id)

    ilo_map = {ilo.ilo_number: ilo.max_score for ilo in ilos}
    
    # Map ilo.id -> ilo_number for reverse lookup when building student scores
    ilo_id_to_num = {ilo.id: ilo.ilo_number for ilo in ilos}
    
    scores_dict = {}
    for sc in student_scores:
        if sc.student_id not in scores_dict:
            scores_dict[sc.student_id] = {}
        if sc.ilo_id in ilo_id_to_num:
            ilo_num = ilo_id_to_num[sc.ilo_id]
            scores_dict[sc.student_id][ilo_num] = sc.score

    return AssessmentBatchDetail(
        id=assessment.id,
        created_at=assessment.created_at,
        name=assessment.name,
        type=assessment.type,
        ilos=ilo_map,
        scores=scores_dict
    )


async def update_assessment_scores(
    session: AsyncSession,
    instructor_id: int,
    class_id: int,
    assessment_id: int,
    data: AssessmentBatchSubmit,
) -> None:
    await _verify_ownership(session, instructor_id, class_id)
    assessment = await class_repository.get_assessment_by_id(session, assessment_id)
    if not assessment or assessment.class_id != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")
    
    # Delete existing relations to cleanly rewrite
    from sqlalchemy import delete
    await session.execute(delete(StudentScore).where(StudentScore.assessment_id == assessment_id))
    await session.execute(delete(AssessmentILO).where(AssessmentILO.assessment_id == assessment_id))
    
    # Update core assessment
    assessment.name = data.name
    assessment.type = data.type
    session.add(assessment)
    await session.flush()
    
    # Rewrite ILOs
    ilo_records = {} # ilo_number -> id
    for ilo_number, max_score in data.ilos.items():
        ilo = AssessmentILO(
            assessment_id=assessment.id,
            ilo_number=ilo_number,
            max_score=max_score,
        )
        session.add(ilo)
        await session.flush()
        ilo_records[ilo_number] = ilo.id

    # Rewrite StudentScores
    for student_id, scores in data.scores.items():
        for ilo_number, score_val in scores.items():
            if ilo_number in ilo_records:
                student_score = StudentScore(
                    assessment_id=assessment.id,
                    ilo_id=ilo_records[ilo_number],
                    student_id=student_id,
                    score=score_val,
                )
                session.add(student_score)
                
    await session.commit()
    

async def delete_assessment(
    session: AsyncSession, instructor_id: int, class_id: int, assessment_id: int
) -> None:
    await _verify_ownership(session, instructor_id, class_id)
    assessment = await class_repository.get_assessment_by_id(session, assessment_id)
    if not assessment or assessment.class_id != class_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    await class_repository.delete_assessment(session, assessment_id)


async def get_student_course_dashboard(
    session: AsyncSession,
    instructor_id: int,
    class_id: int,
    student_id: int,
) -> dict:
    """
    Build the per-course ASPIRE report for one of the instructor's students.
    Returns the same JSON shape as GET /api/student/dashboard.
    """
    from ml.config import COURSE_PROFILES, get_course_ilo_count
    from ml.report import build_course_report

    cls = await _verify_ownership(session, instructor_id, class_id)

    # Verify the student is enrolled in this class.
    enrollment = await session.execute(
        select(ClassEnrollment).where(
            ClassEnrollment.class_id == class_id,
            ClassEnrollment.student_id == student_id,
        )
    )
    if not enrollment.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student is not enrolled in this class.",
        )

    if cls.subject_name not in COURSE_PROFILES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown course: {cls.subject_name}",
        )

    # Aggregate this student's ILO rows for this class only.
    score_rows = await session.execute(
        select(StudentScore, AssessmentILO)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .where(
            StudentScore.student_id == student_id,
            Assessment.class_id == class_id,
        )
    )
    rows = score_rows.all()
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No scores recorded for {cls.subject_name}.",
        )

    ilo_count = get_course_ilo_count(cls.subject_name)
    raw_totals: dict[int, float] = {i: 0.0 for i in range(1, ilo_count + 1)}
    max_totals: dict[int, float] = {i: 0.0 for i in range(1, ilo_count + 1)}
    for score, ilo in rows:
        if ilo.ilo_number in raw_totals:
            raw_totals[ilo.ilo_number] += score.score
            max_totals[ilo.ilo_number] += ilo.max_score

    missing = [n for n in range(1, ilo_count + 1) if max_totals[n] <= 0]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No scores recorded for ILO {', '.join(map(str, missing))} of {cls.subject_name}.",
        )

    ilo_raw    = [raw_totals[i] for i in range(1, ilo_count + 1)]
    ilo_totals = [max_totals[i] for i in range(1, ilo_count + 1)]

    student = await session.execute(select(User).where(User.id == student_id))
    student_user = student.scalar_one_or_none()
    student_name = student_user.full_name if student_user else ""

    try:
        return await asyncio.to_thread(
            build_course_report,
            cls.subject_name,
            ilo_raw,
            ilo_totals,
            student_name,
            cls.semester,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to build report") from exc
