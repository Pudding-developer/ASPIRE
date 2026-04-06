import random
import string

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func

from app.models.class_model import Class, ClassEnrollment, Assessment, AssessmentILO, StudentScore
from app.schemas.class_schema import ClassCreate


async def get_classes_by_instructor(session: AsyncSession, instructor_id: int) -> list[Class]:
    result = await session.execute(
        select(Class).where(
            Class.instructor_id == instructor_id,
            Class.is_archived == False,  # noqa: E712
        )
    )
    return result.scalars().all()


async def get_archived_by_instructor(session: AsyncSession, instructor_id: int) -> list[Class]:
    result = await session.execute(
        select(Class).where(
            Class.instructor_id == instructor_id,
            Class.is_archived == True,  # noqa: E712
        )
    )
    return result.scalars().all()


async def get_class_by_id(session: AsyncSession, class_id: int) -> Class | None:
    result = await session.execute(select(Class).where(Class.id == class_id))
    return result.scalar_one_or_none()


async def create_class(session: AsyncSession, instructor_id: int, data: ClassCreate) -> Class:
    class_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    new_class = Class(
        instructor_id=instructor_id,
        subject_name=data.subject_name,
        course_code=data.course_code,
        year_level=data.year_level,
        semester=data.semester,
        section=data.section,
        class_code=class_code,
    )
    session.add(new_class)
    await session.commit()
    await session.refresh(new_class)
    return new_class


async def archive_class(session: AsyncSession, class_id: int) -> Class:
    result = await session.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    if not cls:
        raise ValueError(f"Class {class_id} not found")
    cls.is_archived = True
    cls.archived_at = datetime.utcnow()
    session.add(cls)
    await session.commit()
    await session.refresh(cls)
    return cls


async def delete_class(session: AsyncSession, class_id: int) -> None:
    result = await session.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    if not cls:
        raise ValueError(f"Class {class_id} not found")
    await session.delete(cls)
    await session.commit()


async def get_student_count(session: AsyncSession, class_id: int) -> int:
    result = await session.execute(
        select(func.count()).select_from(ClassEnrollment).where(
            ClassEnrollment.class_id == class_id
        )
    )
    return result.scalar()


async def get_dashboard_stats(session: AsyncSession, instructor_id: int) -> dict:
    # Active classes for this instructor
    active_classes = await get_classes_by_instructor(session, instructor_id)
    active_count = len(active_classes)
    active_ids = [c.id for c in active_classes]

    # Total unique enrolled students across active classes
    if active_ids:
        result = await session.execute(
            select(func.count(func.distinct(ClassEnrollment.student_id))).where(
                ClassEnrollment.class_id.in_(active_ids)
            )
        )
        total_students = result.scalar() or 0
    else:
        total_students = 0

    # Average score percentage across all scores in active classes
    avg_performance = None
    if active_ids:
        result = await session.execute(
            select(
                func.avg(StudentScore.score / AssessmentILO.max_score * 100)
            ).join(
                AssessmentILO, StudentScore.ilo_id == AssessmentILO.id
            ).join(
                Assessment, StudentScore.assessment_id == Assessment.id
            ).where(
                Assessment.class_id.in_(active_ids),
                AssessmentILO.max_score > 0,
            )
        )
        raw = result.scalar()
        if raw is not None:
            avg_performance = round(float(raw), 1)

    return {
        "total_students": total_students,
        "active_courses": active_count,
        "avg_performance": avg_performance,
    }
