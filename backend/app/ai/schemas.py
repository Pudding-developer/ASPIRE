"""
schemas.py — Pydantic models for AI pipeline input/output.
"""
from pydantic import BaseModel, Field


class SkillEntry(BaseModel):
    name: str
    proficiency: str = Field(description="beginner | intermediate | advanced")
    source: str = Field(description="academic | github | both")


class SkillProfile(BaseModel):
    technical_skills: list[SkillEntry] = []
    programming_languages: list[SkillEntry] = []
    frameworks: list[str] = []
    strengths: list[str] = []
    weaknesses: list[str] = []


class CareerMatch(BaseModel):
    career_name: str
    match_score: float = Field(ge=0, le=100)
    reasoning: str
    matched_skills: list[str] = []
    gap_skills: list[str] = []


class PipelineResult(BaseModel):
    """Final structured output from the AI pipeline."""
    skill_profile: SkillProfile = Field(default_factory=SkillProfile)
    recommended_careers: list[CareerMatch] = []
    recommendations: list[str] = []
    summary: str = ""
