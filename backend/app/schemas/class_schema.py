from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClassCreate(BaseModel):
    subject_name: str
    course_code: str
    year_level: int
    semester: int
    section: str


class ClassOut(BaseModel):
    id: int
    subject_name: str
    course_code: str
    year_level: int
    semester: int
    section: str
    class_code: str
    is_archived: bool
    student_count: int = 0
    created_at: datetime


class DashboardStats(BaseModel):
    total_students: int
    active_courses: int
    school_year: str
    avg_performance: Optional[float]


class AssessmentCreate(BaseModel):
    name: str
    type: str  # "summative" or "formative"
    ilos: list[dict]  # [{"ilo_number": 1, "max_score": 20}, ...]


class ScoreSubmit(BaseModel):
    assessment_id: int
    scores: list[dict]  # [{"student_id": 1, "ilo_id": 1, "score": 18.0}, ...]
