from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.deps import get_current_instructor, get_instructor_advisee
from app.core.database import get_session
from app.models.instructor import Instructor
from app.models.user import User

router = APIRouter()

@router.get("/profile")
async def get_instructor_profile(instructor: Instructor = Depends(get_current_instructor)):
    # This automatically enforces token verification AND the is_active database check!
    return {
        "message": "Instructor profile data",
        "data": {
            "id": instructor.id,
            "email": instructor.email,
            "full_name": instructor.full_name,
            "is_active": instructor.is_active,
        }
    }


# ── Advisee management endpoints ─────────────────────────────────────────────

@router.get("/advisees")
async def list_advisees(
    instructor: Instructor = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_session),
):
    """List all students assigned to the instructor as advisees."""
    result = await db.execute(
        select(User)
        .where(User.advisor_id == instructor.id)
        .where(User.role == "student")
        .order_by(User.full_name.asc())
    )
    advisees = result.scalars().all()
    return {"data": [
        {
            "id": s.id,
            "email": s.email,
            "sr_code": s.sr_code,
            "full_name": s.full_name,
            "avatar_url": s.avatar_url,
            "chosen_career": s.chosen_career,
        }
        for s in advisees
    ]}


@router.get("/advisees/{student_id}/dashboard")
async def get_advisee_dashboard(
    course: str,
    student: User = Depends(get_instructor_advisee),
    db: AsyncSession = Depends(get_session),
):
    """Return the advisee's dashboard report for a specific course."""
    from ml.config import COURSE_PROFILES, get_course_ilo_count
    from ml.report import build_course_report
    import asyncio
    from app.models.class_model import Class, ClassEnrollment, StudentScore, AssessmentILO, Assessment
    from app.api.student_routes import _hash_inputs, _dashboard_cache

    if course not in COURSE_PROFILES:
        raise HTTPException(status_code=400, detail=f"Unknown course: {course}")

    # Verify student is enrolled in the course.
    enrollment_check = await db.execute(
        select(Class.id)
        .join(ClassEnrollment, ClassEnrollment.class_id == Class.id)
        .where(
            ClassEnrollment.student_id == student.id,
            Class.subject_name == course,
        )
    )
    enrolled_class_ids = [row[0] for row in enrollment_check.all()]
    if not enrolled_class_ids:
        raise HTTPException(status_code=403, detail=f"Advisee not enrolled in {course}")

    # Fetch scores.
    score_rows = await db.execute(
        select(StudentScore, AssessmentILO)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .where(
            StudentScore.student_id == student.id,
            Assessment.class_id.in_(enrolled_class_ids),
        )
    )
    rows = score_rows.all()
    if not rows:
        raise HTTPException(status_code=404, detail=f"No scores recorded for {course}")

    # Aggregate
    ilo_count = get_course_ilo_count(course)
    raw_totals = {i: 0.0 for i in range(1, ilo_count + 1)}
    max_totals = {i: 0.0 for i in range(1, ilo_count + 1)}
    for score, ilo in rows:
        if ilo.ilo_number in raw_totals:
            raw_totals[ilo.ilo_number] += score.score
            max_totals[ilo.ilo_number] += ilo.max_score

    if all(max_totals[n] <= 0 for n in range(1, ilo_count + 1)):
        raise HTTPException(status_code=404, detail=f"No scores recorded for {course}")

    ilo_raw = [raw_totals[i] for i in range(1, ilo_count + 1)]
    ilo_totals = [max_totals[i] for i in range(1, ilo_count + 1)]

    semester_row = await db.execute(
        select(Class.semester).where(Class.id.in_(enrolled_class_ids)).limit(1)
    )
    semester = semester_row.scalar_one_or_none()

    cache_key = f"{student.id}:{course}:{_hash_inputs(ilo_raw, ilo_totals, semester)}"
    cached = _dashboard_cache.get(cache_key)
    if cached is not None:
        return {"data": cached}

    try:
        report = await asyncio.to_thread(
            build_course_report,
            course,
            ilo_raw,
            ilo_totals,
            student.full_name or "",
            semester,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to build report") from exc

    _dashboard_cache[cache_key] = report
    return {"data": report}


@router.get("/advisees/{student_id}/predictions")
async def get_advisee_predictions(
    semester: Optional[int] = None,
    year_level: Optional[int] = None,
    category: Optional[str] = None,
    student: User = Depends(get_instructor_advisee),
    db: AsyncSession = Depends(get_session),
):
    """Return the advisee's predicted skill levels."""
    from app.models.class_model import Class, ClassEnrollment, StudentScore, AssessmentILO, Assessment
    from app.api.student_routes import _hash_inputs, _predictions_cache
    import asyncio

    query = select(StudentScore, AssessmentILO, Class) \
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id) \
        .join(Assessment, StudentScore.assessment_id == Assessment.id) \
        .join(Class, Assessment.class_id == Class.id) \
        .where(StudentScore.student_id == student.id)

    if semester:
        query = query.where(Class.semester == semester)
    if year_level:
        query = query.where(Class.year_level == year_level)
    
    if category and category != 'All Subjects':
        if category == 'Mathematics':
            query = query.where(Class.course_code.like('MATH%'))
        elif category == 'Engineering Core':
            query = query.where(Class.course_code.like('ENGG%'))
        elif category == 'General Education':
            query = query.where(Class.course_code.like('GEd%'))
        elif category == 'Computer Science':
            query = query.where(Class.course_code.like('CpE%'))
        elif category == 'Technical Electives':
            query = query.where(Class.course_code.like('CpEE%'))

    result = await db.execute(query)
    rows = result.all()

    if not rows:
        return {"data": {
            "aggregated_skills": {},
            "top_skills": [],
            "weak_skills": [],
            "per_course": [],
            "overall_outcome": "No Data"
        }}

    from collections import defaultdict
    course_ilos = defaultdict(lambda: defaultdict(list))

    for score, ilo, cls in rows:
        pct = (score.score / ilo.max_score * 100) if ilo.max_score > 0 else 0.0
        course_ilos[cls.subject_name][ilo.ilo_number].append(pct)

    enrolled_query = select(Class).join(ClassEnrollment, Class.id == ClassEnrollment.class_id) \
        .where(ClassEnrollment.student_id == student.id)
    if semester:
        enrolled_query = enrolled_query.where(Class.semester == semester)
    if year_level:
        enrolled_query = enrolled_query.where(Class.year_level == year_level)
    
    enrolled_res = await db.execute(enrolled_query)
    for cls in enrolled_res.scalars().all():
        if cls.subject_name not in course_ilos:
            course_ilos[cls.subject_name] = {}

    scores_by_course = []
    for course_name, ilos in course_ilos.items():
        entry = {"course": course_name}
        for ilo_num in [1, 2, 3, 4]:
            values = ilos.get(ilo_num, [])
            entry[f"ilo{ilo_num}"] = round(sum(values) / len(values), 2) if values else 0.0
        scores_by_course.append(entry)

    if not scores_by_course:
        return {"data": {
            "aggregated_skills": {},
            "top_skills": [],
            "weak_skills": [],
            "per_course": [],
            "overall_outcome": "No Data"
        }}

    cache_key = f"{student.id}:{semester}:{year_level}:{category}:{_hash_inputs(scores_by_course)}"
    cached = _predictions_cache.get(cache_key)
    if cached is not None:
        return {"data": cached}

    from app.services.ml_service import predict_student_aggregate
    predictions = await asyncio.to_thread(predict_student_aggregate, scores_by_course)
    _predictions_cache[cache_key] = predictions

    return {"data": predictions}


@router.get("/advisees/{student_id}/scores")
async def get_advisee_scores(
    student: User = Depends(get_instructor_advisee),
    db: AsyncSession = Depends(get_session),
):
    """Return the advisee's academic scores."""
    from app.models.class_model import Class, StudentScore, AssessmentILO, Assessment

    result = await db.execute(
        select(StudentScore, Assessment, AssessmentILO, Class)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Class, Assessment.class_id == Class.id)
        .where(StudentScore.student_id == student.id)
        .order_by(Class.subject_name, Assessment.name, AssessmentILO.ilo_number)
    )
    rows = result.all()

    scores = []
    for score, assessment, ilo, cls in rows:
        pct = round((score.score / ilo.max_score) * 100, 1) if ilo.max_score > 0 else 0.0
        scores.append({
            "class_id": cls.id,
            "subject_name": cls.subject_name,
            "course_code": cls.course_code,
            "assessment_name": assessment.name,
            "assessment_type": assessment.type,
            "ilo_number": ilo.ilo_number,
            "max_score": ilo.max_score,
            "score": score.score,
            "percentage": pct,
            "submitted_at": score.submitted_at.isoformat() + "Z",
        })

    return {"data": scores}


@router.get("/advisees/{student_id}/classes")
async def get_advisee_classes(
    student: User = Depends(get_instructor_advisee),
    db: AsyncSession = Depends(get_session),
):
    """Return classes the advisee is enrolled in."""
    from collections import defaultdict
    from app.models.instructor import Instructor
    from app.models.class_model import Class, ClassEnrollment

    result = await db.execute(
        select(Class, ClassEnrollment, Instructor)
        .join(ClassEnrollment, Class.id == ClassEnrollment.class_id)
        .join(Instructor, Class.instructor_id == Instructor.id)
        .where(ClassEnrollment.student_id == student.id)
        .where(Class.is_archived == False)
    )
    rows = result.all()

    class_ids = [cls.id for cls, _, _ in rows]
    classmates_by_class = defaultdict(list)
    if class_ids:
        classmates_result = await db.execute(
            select(ClassEnrollment.class_id, User.full_name, User.avatar_url)
            .join(User, User.id == ClassEnrollment.student_id)
            .where(ClassEnrollment.class_id.in_(class_ids))
        )
        for class_id, name, avatar in classmates_result.all():
            classmates_by_class[class_id].append({"name": name, "avatar": avatar})

    data = []
    for cls, enrollment, instructor in rows:
        data.append({
            "id": cls.id,
            "subject_name": cls.subject_name,
            "course_code": cls.course_code,
            "year_level": cls.year_level,
            "semester": cls.semester,
            "section": cls.section,
            "class_code": cls.class_code,
            "enrolled_at": enrollment.enrolled_at.isoformat() + "Z",
            "instructor_name": instructor.full_name,
            "instructor_avatar": instructor.avatar_url,
            "classmates": classmates_by_class.get(cls.id, []),
        })

    return {"data": data}


@router.get("/advisees/{student_id}/github/summary")
async def get_advisee_github_summary(
    student: User = Depends(get_instructor_advisee),
    db: AsyncSession = Depends(get_session),
):
    """Return advisee's GitHub summary."""
    from app.services.github_service import get_summary
    data, cached_at = await get_summary(db, student.id)
    if data is None:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return {"data": data, "cached_at": cached_at}


@router.get("/advisees/{student_id}/github/repositories")
async def get_advisee_github_repositories(
    student: User = Depends(get_instructor_advisee),
    db: AsyncSession = Depends(get_session),
):
    """Return advisee's GitHub repositories."""
    from app.services.github_service import get_repositories
    data, cached_at = await get_repositories(db, student.id)
    if data is None:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return {"data": data, "cached_at": cached_at}


@router.get("/advisees/{student_id}/github/contributions")
async def get_advisee_github_contributions(
    student: User = Depends(get_instructor_advisee),
    db: AsyncSession = Depends(get_session),
):
    """Return advisee's GitHub contributions."""
    from app.services.github_service import get_contribution_data
    data, cached_at = await get_contribution_data(db, student.id)
    if data is None:
        raise HTTPException(status_code=404, detail="No analysis has been run yet.")
    return {"data": data, "cached_at": cached_at}


@router.get("/advisees/{student_id}/roadmap/{career_slug}")
async def get_advisee_roadmap(
    career_slug: str,
    student: User = Depends(get_instructor_advisee),
    db: AsyncSession = Depends(get_session),
):
    """Return the advisee's career roadmap with overlay data."""
    from app.services.roadmap_service import ROADMAP_SLUGS, get_roadmap_with_overlay, _resolve_career_slug
    resolved = career_slug if career_slug in ROADMAP_SLUGS.values() else (
        _resolve_career_slug(career_slug)
    )
    if not resolved:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown career slug or title: '{career_slug}'."
        )

    try:
        data = await get_roadmap_with_overlay(db, student.id, resolved)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {"data": data}
