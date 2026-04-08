"""
student_routes.py — Student-facing API endpoints.

Provides profile data, academic scores, enrolled classes, and ML skill predictions.
"""
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.api.deps import get_current_student
from app.models.user import User
from app.models.class_model import (
    Class, ClassEnrollment, Assessment, AssessmentILO, StudentScore,
)

router = APIRouter()


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
    """Return all classes the student is enrolled in."""
    result = await db.execute(
        select(Class, ClassEnrollment)
        .join(ClassEnrollment, Class.id == ClassEnrollment.class_id)
        .where(ClassEnrollment.student_id == current_user.id)
        .where(Class.is_archived == False)
    )
    rows = result.all()

    return {"data": [
        {
            "id": cls.id,
            "subject_name": cls.subject_name,
            "course_code": cls.course_code,
            "year_level": cls.year_level,
            "semester": cls.semester,
            "section": cls.section,
            "class_code": cls.class_code,
            "enrolled_at": enrollment.enrolled_at.isoformat(),
        }
        for cls, enrollment in rows
    ]}


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
