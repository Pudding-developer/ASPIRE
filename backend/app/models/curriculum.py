from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Curriculum(SQLModel, table=True):
    __tablename__ = "curricula"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class CurriculumSubject(SQLModel, table=True):
    __tablename__ = "curriculum_subjects"
    id: Optional[int] = Field(default=None, primary_key=True)
    curriculum_id: int = Field(foreign_key="curricula.id", ondelete="CASCADE", index=True)
    year: str       # E.g. "1", "2", "3", "4"
    semester: str   # E.g. "1", "2", "3" (midyear)
    code: str = Field(index=True)  # E.g. "ENGG 401"
    title: str      # E.g. "Introduction to Engineering"

