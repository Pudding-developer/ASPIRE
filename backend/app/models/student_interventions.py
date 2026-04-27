"""
student_interventions.py — Persists the latest skill-intervention set for a student.

Generated independently of the 7-agent CrewAI pipeline by a dedicated Gemini call
(see app.services.interventions_service). One row per student, upserted whenever
their scores change.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class StudentInterventions(SQLModel, table=True):
    __tablename__ = "student_interventions"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="user.id", index=True, unique=True)
    interventions_json: str = Field(default="[]")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
