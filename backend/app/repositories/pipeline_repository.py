"""
pipeline_repository.py — DB query helpers for pipeline jobs and career reports.

Provides get_previous_report() for Agent 7 to compare growth over time.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.pipeline_models import CareerReport


async def get_previous_report(
    db: AsyncSession,
    student_id: int,
) -> CareerReport | None:
    """
    Return the most recent completed CareerReport for a student.

    This is the report Agent 7 uses as the 'before' baseline.
    Filters to reports that have a non-empty report_json (completed runs only).
    """
    result = await db.execute(
        select(CareerReport)
        .where(CareerReport.student_id == student_id)
        .where(CareerReport.report_json != "{}")
        .order_by(CareerReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_latest_completed_report(
    db: AsyncSession,
    student_id: int,
) -> CareerReport | None:
    """
    Return the most recent completed CareerReport for a student.
    Used by student_routes to serve the GET /api/student/career endpoint.
    """
    result = await db.execute(
        select(CareerReport)
        .where(CareerReport.student_id == student_id)
        .where(CareerReport.report_json != "{}")
        .order_by(CareerReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_latest_report(
    db: AsyncSession,
    student_id: int,
) -> CareerReport | None:
    """
    Return the most recent completed CareerReport for a student.
    Used by roadmap_service to overlay skill data onto career nodes.
    Alias of get_latest_completed_report, kept under this name per the spec.
    """
    result = await db.execute(
        select(CareerReport)
        .where(CareerReport.student_id == student_id)
        .where(CareerReport.report_json != "{}")
        .order_by(CareerReport.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
