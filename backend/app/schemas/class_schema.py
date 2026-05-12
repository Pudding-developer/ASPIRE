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


class StudentPerformanceRow(BaseModel):
    student_id: int
    full_name: str
    avatar_url: Optional[str] = None
    sr_code: Optional[str] = None
    class_id: int
    course_code: str
    subject_name: str
    year_level: int
    semester: int
    avg_percentage: float


class ClassRepresentativeRow(BaseModel):
    student_id: int
    full_name: str
    avatar_url: Optional[str] = None
    sr_code: Optional[str] = None
    class_id: int
    course_code: str
    subject_name: str
    year_level: int
    semester: int


class DashboardStats(BaseModel):
    total_students: int
    active_courses: int
    school_year: str
    avg_performance: Optional[float]
    student_performance: list[StudentPerformanceRow] = []
    class_representatives: list[ClassRepresentativeRow] = []


class AssessmentCreate(BaseModel):
    name: str
    type: str  # "summative" or "formative"
    ilos: list[dict]  # [{"ilo_number": 1, "max_score": 20}, ...]


class ScoreSubmit(BaseModel):
    assessment_id: int
    scores: list[dict]  # [{"student_id": 1, "ilo_id": 1, "score": 18.0}, ...]


class AssessmentBatchSubmit(BaseModel):
    name: str # e.g. "Midterm Exam"
    type: str # e.g. "Summative"
    ilos: dict[int, float] # { 1: 50.0, 2: 50.0, ... } mapping ILO number to max score
    scores: dict[int, dict[int, float]] # { 1: { 1: 45.0, 2: 40.0 }, ... } mapping student ID to ILO scores

class AssessmentSummary(BaseModel):
    id: int
    name: str
    type: str
    created_at: datetime


class AssessmentBatchDetail(AssessmentBatchSubmit):
    id: int
    created_at: datetime
