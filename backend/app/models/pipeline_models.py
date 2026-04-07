"""
pipeline_models.py — Database tables for the AI career-mapping pipeline.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class PipelineJob(SQLModel, table=True):
    """Tracks the execution status of an AI pipeline run."""
    __tablename__ = "pipeline_jobs"

    id: str = Field(primary_key=True)  # UUID
    student_id: int = Field(foreign_key="user.id", index=True)
    status: str = Field(default="pending")  # pending | running | completed | failed
    current_step: str = Field(default="")
    percentage: int = Field(default=0)
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class CareerReport(SQLModel, table=True):
    """Stores the AI-generated career readiness report for a student."""
    __tablename__ = "career_reports"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id", index=True)
    job_id: str = Field(index=True)
    report_json: str = Field(default="{}")  # Full pipeline result as JSON
    summary: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
