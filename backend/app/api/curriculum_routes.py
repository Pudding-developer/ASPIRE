from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List

from app.core.database import get_session
from app.models.curriculum import Curriculum, CurriculumSubject

router = APIRouter()

@router.get("", response_model=List[dict])
async def get_curriculum_list(session: AsyncSession = Depends(get_session)):
    """
    Fetch all uploaded curriculum versions (metadata only).
    """
    result = await session.execute(select(Curriculum).order_by(Curriculum.uploaded_at.desc()))
    curricula = result.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "uploaded_at": c.uploaded_at.isoformat()
        }
        for c in curricula
    ]

@router.get("/{curriculum_id}/subjects", response_model=List[dict])
async def get_curriculum_subjects(curriculum_id: int, session: AsyncSession = Depends(get_session)):
    """
    Fetch all curriculum subjects for a specific curriculum version, sorted by year, semester, and code.
    """
    result = await session.execute(
        select(CurriculumSubject)
        .where(CurriculumSubject.curriculum_id == curriculum_id)
        .order_by(
            CurriculumSubject.year,
            CurriculumSubject.semester,
            CurriculumSubject.code
        )
    )
    subjects = result.scalars().all()
    return [
        {
            "id": s.id,
            "curriculum_id": s.curriculum_id,
            "year": s.year,
            "semester": s.semester,
            "code": s.code,
            "title": s.title
        }
        for s in subjects
    ]

