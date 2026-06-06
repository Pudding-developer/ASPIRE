"""
academic_skill_cache.py — SQLModel for caching Agent 2 (Academic Analyzer) output.

Keyed on a SHA-256 hash of the student's academic scores. If the scores haven't
changed since the last run, the cached extraction is returned directly — Agent 2
is skipped and the pipeline runs faster for students whose grades didn't change.
"""
from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field


class AcademicSkillCache(SQLModel, table=True):
    __tablename__ = "academic_skill_cache"

    student_id: int = Field(
        foreign_key="user.id",
        primary_key=True,
        description="One row per student — upserted on each fresh extraction.",
    )
    data_hash: str = Field(
        index=True,
        description="SHA-256 of the serialized academic_scores JSON used as input.",
    )
    academic_skills: Optional[str] = Field(
        default=None,
        description="JSON string of Agent 2's full output (academic skill analysis).",
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
