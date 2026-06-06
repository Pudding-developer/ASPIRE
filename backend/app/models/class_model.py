from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Class(SQLModel, table=True):
    __tablename__ = "classes"
    id: Optional[int] = Field(default=None, primary_key=True)
    instructor_id: int = Field(foreign_key="instructor.id", index=True)
    curriculum_id: Optional[int] = Field(default=None, foreign_key="curricula.id")
    subject_name: str
    course_code: str
    year_level: int  # 1-4
    semester: int    # 1 or 2
    section: str
    class_code: str = Field(unique=True, index=True)  # e.g. CS201-2026-A-XY7Z
    is_archived: bool = Field(default=False)
    archived_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ClassEnrollment(SQLModel, table=True):
    __tablename__ = "class_enrollments"
    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: int = Field(foreign_key="classes.id", index=True)
    student_id: int = Field(foreign_key="user.id", index=True)
    enrolled_at: datetime = Field(default_factory=datetime.utcnow)
    is_class_rep: bool = Field(default=False)


class Assessment(SQLModel, table=True):
    __tablename__ = "assessments"
    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: int = Field(foreign_key="classes.id", index=True)
    name: str          # e.g. "Midterm Exam"
    type: str          # "summative" or "formative"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AssessmentILO(SQLModel, table=True):
    __tablename__ = "assessment_ilos"
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(foreign_key="assessments.id", index=True)
    ilo_number: int    # 1, 2, 3...
    max_score: float


class StudentScore(SQLModel, table=True):
    __tablename__ = "student_scores"
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(foreign_key="assessments.id", index=True)
    ilo_id: int = Field(foreign_key="assessment_ilos.id", index=True)
    student_id: int = Field(foreign_key="user.id", index=True)
    score: float
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
