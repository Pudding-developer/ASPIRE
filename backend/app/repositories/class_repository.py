import random
import string
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func

from app.models.class_model import Class, ClassEnrollment, Assessment, AssessmentILO, StudentScore
from app.models.user import User
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


async def restore_class(session: AsyncSession, class_id: int) -> Class:
    result = await session.execute(select(Class).where(Class.id == class_id))
    cls = result.scalar_one_or_none()
    if not cls:
        raise ValueError(f"Class {class_id} not found")
    cls.is_archived = False
    cls.archived_at = None
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


async def get_students_by_class(session: AsyncSession, class_id: int) -> list[dict[str, object | None]]:
    result = await session.execute(
        select(User, ClassEnrollment)
        .join(ClassEnrollment, User.id == ClassEnrollment.student_id)
        .where(ClassEnrollment.class_id == class_id)
        .where(User.role == "student")
        .order_by(User.full_name.asc())
    )

    students = []
    for user, enrollment in result.all():
        students.append({
            "id": user.id,
            "sr_code": user.sr_code,
            "full_name": user.full_name,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
            "is_class_rep": bool(enrollment.is_class_rep),
        })

    return students


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


async def get_student_performance_rows(
    session: AsyncSession, instructor_id: int
) -> list[dict]:
    """Per (student, class) average score percentage across an instructor's active classes."""
    active_classes = await get_classes_by_instructor(session, instructor_id)
    active_ids = [c.id for c in active_classes]
    if not active_ids:
        return []

    avg_pct = func.avg(StudentScore.score / AssessmentILO.max_score * 100).label("avg_pct")

    result = await session.execute(
        select(
            User.id,
            User.full_name,
            User.avatar_url,
            User.sr_code,
            Class.id,
            Class.course_code,
            Class.subject_name,
            Class.year_level,
            Class.semester,
            avg_pct,
        )
        .join(StudentScore, StudentScore.student_id == User.id)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .join(Class, Assessment.class_id == Class.id)
        .where(
            Assessment.class_id.in_(active_ids),
            AssessmentILO.max_score > 0,
        )
        .group_by(
            User.id, User.full_name, User.avatar_url, User.sr_code,
            Class.id, Class.course_code, Class.subject_name,
            Class.year_level, Class.semester,
        )
    )

    rows = []
    for sid, name, avatar, sr_code, cid, course_code, subject, year, sem, pct in result.all():
        if pct is None:
            continue
        rows.append({
            "student_id": sid,
            "full_name": name,
            "avatar_url": avatar,
            "sr_code": sr_code,
            "class_id": cid,
            "course_code": course_code,
            "subject_name": subject,
            "year_level": year,
            "semester": sem,
            "avg_percentage": round(float(pct), 1),
        })
    return rows


async def get_class_representatives(
    session: AsyncSession, instructor_id: int
) -> list[dict]:
    """Students appointed as class representative across the instructor's active classes."""
    active_classes = await get_classes_by_instructor(session, instructor_id)
    active_ids = [c.id for c in active_classes]
    if not active_ids:
        return []

    result = await session.execute(
        select(
            User.id,
            User.full_name,
            User.avatar_url,
            User.sr_code,
            Class.id,
            Class.course_code,
            Class.subject_name,
            Class.year_level,
            Class.semester,
        )
        .join(ClassEnrollment, ClassEnrollment.student_id == User.id)
        .join(Class, ClassEnrollment.class_id == Class.id)
        .where(
            ClassEnrollment.class_id.in_(active_ids),
            ClassEnrollment.is_class_rep == True,  # noqa: E712
        )
        .order_by(Class.course_code.asc(), User.full_name.asc())
    )

    return [
        {
            "student_id": sid,
            "full_name": name,
            "avatar_url": avatar,
            "sr_code": sr_code,
            "class_id": cid,
            "course_code": course_code,
            "subject_name": subject,
            "year_level": year,
            "semester": sem,
        }
        for sid, name, avatar, sr_code, cid, course_code, subject, year, sem in result.all()
    ]


async def set_class_representative(
    session: AsyncSession, class_id: int, student_id: int, is_rep: bool
) -> ClassEnrollment | None:
    result = await session.execute(
        select(ClassEnrollment).where(
            ClassEnrollment.class_id == class_id,
            ClassEnrollment.student_id == student_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        return None
    enrollment.is_class_rep = is_rep
    session.add(enrollment)
    await session.commit()
    await session.refresh(enrollment)
    return enrollment


async def get_assessments_by_class(session: AsyncSession, class_id: int) -> list[Assessment]:
    result = await session.execute(
        select(Assessment)
        .where(Assessment.class_id == class_id)
        .order_by(Assessment.created_at.desc())
    )
    return list(result.scalars().all())


async def get_graded_student_ids_per_assessment(
    session: AsyncSession, class_id: int
) -> dict[int, set[int]]:
    """Return {assessment_id: {student_ids who have at least one score}} for a class."""
    result = await session.execute(
        select(StudentScore.assessment_id, StudentScore.student_id)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .where(
            Assessment.class_id == class_id,
            StudentScore.score > 0
        )
        .distinct()
    )
    mapping: dict[int, set[int]] = {}
    for aid, sid in result.all():
        mapping.setdefault(aid, set()).add(sid)
    return mapping


async def get_enrolled_student_ids(session: AsyncSession, class_id: int) -> set[int]:
    result = await session.execute(
        select(ClassEnrollment.student_id).where(ClassEnrollment.class_id == class_id)
    )
    return {sid for (sid,) in result.all()}


async def get_assessment_by_id(session: AsyncSession, assessment_id: int) -> Assessment | None:
    result = await session.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    return result.scalar_one_or_none()


async def get_assessment_ilos(session: AsyncSession, assessment_id: int) -> list[AssessmentILO]:
    result = await session.execute(
        select(AssessmentILO).where(AssessmentILO.assessment_id == assessment_id)
    )
    return list(result.scalars().all())


async def get_student_scores(session: AsyncSession, assessment_id: int) -> list[StudentScore]:
    result = await session.execute(
        select(StudentScore).where(StudentScore.assessment_id == assessment_id)
    )
    return list(result.scalars().all())


async def delete_assessment(session: AsyncSession, assessment_id: int) -> None:
    from sqlalchemy import delete
    await session.execute(delete(StudentScore).where(StudentScore.assessment_id == assessment_id))
    await session.execute(delete(AssessmentILO).where(AssessmentILO.assessment_id == assessment_id))
    await session.execute(delete(Assessment).where(Assessment.id == assessment_id))
    await session.commit()


async def get_enrolled_subjects(
    db: AsyncSession,
    student_id: int
) -> list[str]:
    """Returns list of subject_name strings for all classes
    the student is enrolled in."""
    result = await db.execute(
        select(Class.subject_name)
        .join(ClassEnrollment, ClassEnrollment.class_id == Class.id)
        .where(ClassEnrollment.student_id == student_id)
    )
    return list(result.scalars().all())

