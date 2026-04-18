"""
roadmap_routes.py — FastAPI routes for the career roadmap overlay feature.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session as get_db
from app.api.deps import get_current_student
from app.models.user import User
from app.services.roadmap_service import (
    ROADMAP_SLUGS,
    get_roadmap_with_overlay,
    _resolve_career_slug,
)

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.get("/slugs/all")
async def get_all_slugs(
    current_user: User = Depends(get_current_student),
):
    """Return the full career → slug mapping."""
    return {"data": ROADMAP_SLUGS}


@router.get("/{career_slug}")
async def get_roadmap(
    career_slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """
    Return roadmap nodes for career_slug, overlaid with the authenticated
    student's skill and Agent 7 progression data.

    Accepts exact slugs (e.g. "backend") or career titles that partially
    match a known slug (resolved via _resolve_career_slug).
    """
    # Allow passing a raw career title as the slug param (fuzzy resolution)
    resolved = career_slug if career_slug in ROADMAP_SLUGS.values() else (
        _resolve_career_slug(career_slug)
    )
    if not resolved:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown career slug or title: '{career_slug}'. "
                   f"Valid slugs: {list(ROADMAP_SLUGS.values())}",
        )

    try:
        data = await get_roadmap_with_overlay(db, current_user.id, resolved)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {"data": data}
