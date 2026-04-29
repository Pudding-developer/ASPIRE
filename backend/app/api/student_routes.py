"""
student_routes.py — Student-facing API endpoints.

Provides profile data, academic scores, enrolled classes, ML skill predictions,
and career goal selection (PATCH/GET /career).
"""
import asyncio
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.api.deps import get_current_student
from app.models.user import User
from app.models.class_model import (
    Class, ClassEnrollment, Assessment, AssessmentILO, StudentScore,
)

router = APIRouter()


# ── Career constants ──────────────────────────────────────────────────────────

VALID_CAREERS = [
    "Full Stack Developer",
    "Backend Developer",
    "Frontend Developer",
    "DevOps Engineer",
    "Data Scientist",
    "AI Engineer",
    "Cybersecurity",
    "Machine Learning",
    "Software Architect",
    "QA Engineer",
]

ROADMAP_LINKS = {
    "Full Stack Developer": "https://roadmap.sh/full-stack",
    "Backend Developer":    "https://roadmap.sh/backend",
    "Frontend Developer":   "https://roadmap.sh/frontend",
    "DevOps Engineer":      "https://roadmap.sh/devops",
    "Data Scientist":       "https://roadmap.sh/data-scientist",
    "AI Engineer":          "https://roadmap.sh/ai-engineer",
    "Cybersecurity":        "https://roadmap.sh/cyber-security",
    "Machine Learning":     "https://roadmap.sh/machine-learning",
    "Software Architect":   "https://roadmap.sh/software-architect",
    "QA Engineer":          "https://roadmap.sh/qa",
}

# ── Profile ──────────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_student_profile(
    current_user: User = Depends(get_current_student),
):
    """Return the authenticated student's profile."""
    return {"data": {
        "id": current_user.id,
        "sr_code": current_user.sr_code,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url,
    }}


# ── Enrolled Classes ─────────────────────────────────────────────────────────

@router.get("/classes")
async def get_enrolled_classes(
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """Return all classes the student is enrolled in, with instructor and classmates."""
    from app.models.instructor import Instructor
    
    result = await db.execute(
        select(Class, ClassEnrollment, Instructor)
        .join(ClassEnrollment, Class.id == ClassEnrollment.class_id)
        .join(Instructor, Class.instructor_id == Instructor.id)
        .where(ClassEnrollment.student_id == current_user.id)
        .where(Class.is_archived == False)
    )
    rows = result.all()

    data = []
    for cls, enrollment, instructor in rows:
        from sqlalchemy.orm import aliased
        EnrollmentAlias = aliased(ClassEnrollment)
        classmates_result = await db.execute(
            select(User.full_name, User.avatar_url)
            .join(EnrollmentAlias, User.id == EnrollmentAlias.student_id)
            .where(EnrollmentAlias.class_id == cls.id)
        )
        classmates = [
            {"name": row.full_name, "avatar": row.avatar_url}
            for row in classmates_result.all()
        ]

        data.append({
            "id": cls.id,
            "subject_name": cls.subject_name,
            "course_code": cls.course_code,
            "year_level": cls.year_level,
            "semester": cls.semester,
            "section": cls.section,
            "class_code": cls.class_code,
            "enrolled_at": enrollment.enrolled_at.isoformat(),
            "instructor_name": instructor.full_name,
            "instructor_avatar": instructor.avatar_url,
            "classmates": classmates
        })

    return {"data": data}


# ── Join Class ───────────────────────────────────────────────────────────────

class JoinClassBody(BaseModel):
    class_code: str

@router.post("/join")
async def join_class(
    body: JoinClassBody,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """Enroll the student in a class using its class code."""
    result = await db.execute(
        select(Class).where(Class.class_code == body.class_code, Class.is_archived == False)
    )
    cls = result.scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid class code. Please check with your instructor.")

    existing = await db.execute(
        select(ClassEnrollment).where(
            ClassEnrollment.class_id == cls.id,
            ClassEnrollment.student_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You are already enrolled in this class.")

    enrollment = ClassEnrollment(class_id=cls.id, student_id=current_user.id)
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    return {"data": {
        "id": cls.id,
        "subject_name": cls.subject_name,
        "course_code": cls.course_code,
        "section": cls.section,
        "class_code": cls.class_code,
        "enrolled_at": enrollment.enrolled_at.isoformat(),
    }}


# ── Academic Scores ──────────────────────────────────────────────────────────

@router.get("/scores")
async def get_student_scores(
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """Return all ILO scores for the student, grouped by assessment."""
    result = await db.execute(
        select(StudentScore, Assessment, AssessmentILO, Class)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Class, Assessment.class_id == Class.id)
        .where(StudentScore.student_id == current_user.id)
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
            "submitted_at": score.submitted_at.isoformat(),
        })

    return {"data": scores}


# ── ML Course Dashboard Report ──────────────────────────────────────────────

@router.get("/dashboard")
async def get_course_dashboard(
    course: str,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """
    Return a full ASPIRE course report (JSON) for the student's chosen subject.
    The frontend renders all charts from this payload.
    """
    from ml.config import COURSE_PROFILES, get_course_ilo_count
    from ml.report import build_course_report

    if course not in COURSE_PROFILES:
        raise HTTPException(status_code=400, detail=f"Unknown course: {course}")

    # Verify the student is enrolled in at least one class teaching this course.
    enrollment_check = await db.execute(
        select(Class.id)
        .join(ClassEnrollment, ClassEnrollment.class_id == Class.id)
        .where(
            ClassEnrollment.student_id == current_user.id,
            Class.subject_name == course,
        )
    )
    enrolled_class_ids = [row[0] for row in enrollment_check.all()]
    if not enrolled_class_ids:
        raise HTTPException(status_code=403, detail=f"Not enrolled in {course}")

    # Fetch this student's ILO rows for those classes.
    score_rows = await db.execute(
        select(StudentScore, AssessmentILO)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .where(
            StudentScore.student_id == current_user.id,
            Assessment.class_id.in_(enrolled_class_ids),
        )
    )
    rows = score_rows.all()
    if not rows:
        raise HTTPException(status_code=404, detail=f"No scores recorded for {course}")

    # Aggregate: per ILO number, sum raw score and sum max_score across all assessments.
    ilo_count = get_course_ilo_count(course)
    raw_totals: dict[int, float] = {i: 0.0 for i in range(1, ilo_count + 1)}
    max_totals: dict[int, float] = {i: 0.0 for i in range(1, ilo_count + 1)}
    for score, ilo in rows:
        if ilo.ilo_number in raw_totals:
            raw_totals[ilo.ilo_number] += score.score
            max_totals[ilo.ilo_number] += ilo.max_score

    missing = [n for n in range(1, ilo_count + 1) if max_totals[n] <= 0]
    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"No scores recorded for ILO {', '.join(map(str, missing))} of {course}",
        )

    ilo_raw    = [raw_totals[i] for i in range(1, ilo_count + 1)]
    ilo_totals = [max_totals[i] for i in range(1, ilo_count + 1)]

    # Take the semester of the first enrolled class teaching this course.
    semester_row = await db.execute(
        select(Class.semester).where(Class.id.in_(enrolled_class_ids)).limit(1)
    )
    semester = semester_row.scalar_one_or_none()

    try:
        report = await asyncio.to_thread(
            build_course_report,
            course,
            ilo_raw,
            ilo_totals,
            current_user.full_name or "",
            semester,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to build report") from exc

    return {"data": report}


# ── ML Skill Predictions ────────────────────────────────────────────────────

@router.get("/predictions")
async def get_skill_predictions(
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """
    Aggregate the student's ILO scores per course, run the ML model,
    and return predicted skill scores.
    """
    # Fetch all scores grouped by class (course)
    result = await db.execute(
        select(StudentScore, AssessmentILO, Class)
        .join(AssessmentILO, StudentScore.ilo_id == AssessmentILO.id)
        .join(Assessment, StudentScore.assessment_id == Assessment.id)
        .join(Class, Assessment.class_id == Class.id)
        .where(StudentScore.student_id == current_user.id)
    )
    rows = result.all()

    if not rows:
        raise HTTPException(status_code=404, detail="No scores found. Ask your instructor to post grades first.")

    # Aggregate ILO scores per course: average percentage per ILO number
    from collections import defaultdict
    course_ilos = defaultdict(lambda: defaultdict(list))

    for score, ilo, cls in rows:
        pct = (score.score / ilo.max_score * 100) if ilo.max_score > 0 else 0.0
        course_ilos[cls.subject_name][ilo.ilo_number].append(pct)

    # Build input for ML model: per-course average ILO percentages
    scores_by_course = []
    for course_name, ilos in course_ilos.items():
        entry = {"course": course_name}
        for ilo_num in [1, 2, 3, 4]:
            values = ilos.get(ilo_num, [])
            entry[f"ilo{ilo_num}"] = round(sum(values) / len(values), 2) if values else 0.0
        scores_by_course.append(entry)

    # Run ML model in a thread (joblib/numpy are CPU-bound)
    from app.services.ml_service import predict_student_aggregate
    predictions = await asyncio.to_thread(predict_student_aggregate, scores_by_course)

    return {"data": predictions}


# ── Skill Interventions (standalone, RAG + Gemini) ────────────────────────────

@router.get("/interventions/{student_id}")
async def get_skill_interventions(
    student_id: int,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """
    Return the student's most recently saved skill interventions.
    Returns 404 if generation has never run (typical before the first score).
    """
    if current_user.id != student_id:
        raise HTTPException(status_code=403, detail="You can only view your own interventions.")

    from app.services import interventions_service
    saved = await interventions_service.get_for_student(db, student_id)
    if saved is None:
        raise HTTPException(
            status_code=404,
            detail="No interventions yet. They will be generated automatically once your instructor submits scores.",
        )
    return {"data": saved}


@router.post("/interventions/{student_id}")
async def run_skill_interventions(
    student_id: int,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """
    Synchronously generate fresh interventions and return them. Independent of
    the 7-agent CrewAI pipeline — single Gemini call with curriculum RAG context.
    """
    if current_user.id != student_id:
        raise HTTPException(status_code=403, detail="You can only generate interventions for your own account.")

    from app.services import interventions_service
    try:
        result = await interventions_service.generate_for_student(db, student_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interventions: {exc}",
        )
    return {"data": result}


# ── Career goal selection ─────────────────────────────────────────────────────

class CareerChoicePayload(BaseModel):
    career: str


@router.patch("/career")
async def set_chosen_career(
    payload: CareerChoicePayload,
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """
    Set or update the student's chosen career goal.
    Validates against VALID_CAREERS — returns 400 if unknown.
    """
    if payload.career not in VALID_CAREERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid career. Must be one of: {', '.join(VALID_CAREERS)}",
        )

    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found.")

    user.chosen_career = payload.career
    user.career_chosen_at = datetime.utcnow()
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "chosen_career": user.chosen_career,
        "career_chosen_at": user.career_chosen_at.isoformat() if user.career_chosen_at else None,
        "roadmap_url": ROADMAP_LINKS.get(user.chosen_career),
    }


@router.get("/career")
async def get_chosen_career(
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_session),
):
    """
    Return the student's currently chosen career goal.
    Returns null values if no career has been chosen yet.
    """
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    return {
        "chosen_career": user.chosen_career if user else None,
        "career_chosen_at": (
            user.career_chosen_at.isoformat()
            if user and user.career_chosen_at else None
        ),
        "roadmap_url": ROADMAP_LINKS.get(user.chosen_career) if user and user.chosen_career else None,
    }
