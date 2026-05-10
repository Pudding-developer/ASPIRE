"""
github_skill_cache.py — SQLModel for caching Agent 1 (GitHub Analyzer) output.

Keyed on a SHA-256 hash of the student's raw GitHub data (repos + contributions).
If the data hasn't changed since the last run, the cached extraction is returned
directly — Agent 1 is skipped and the pipeline stays deterministic.
"""
from typing import Optional
from datetime import datetime

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, text
from sqlalchemy.dialects.postgresql import JSONB


class GithubSkillCache(SQLModel, table=True):
    __tablename__ = "github_skill_cache"

    student_id: int = Field(
        foreign_key="user.id",
        primary_key=True,
        description="One row per student — upserted on each fresh extraction.",
    )
    data_hash: str = Field(
        index=True,
        description="SHA-256 of the serialized github_profile JSON used as input.",
    )
    github_skills: Optional[str] = Field(
        default=None,
        description="JSON string of Agent 1's full output dict (github_skills key).",
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
