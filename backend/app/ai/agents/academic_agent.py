"""
academic_agent.py — Agent 2: Academic Performance Analyst.

Analyzes a student's ILO scores and ML model predictions to produce
a subject-mapped academic skill profile with threshold classifications.
"""
from crewai import Agent, LLM
from crewai import Task

from app.core.config import GEMINI_MODEL


def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        max_retries=5,
        timeout=120
    )


def create_academic_analyzer(student_data_tool) -> Agent:
    return Agent(
        role="Academic Performance Analyst",
        goal=(
            "Analyze a BSU CpE student's ILO scores and ML model predictions "
            "to produce an academic skill profile with threshold classifications."
        ),
        backstory=(
            "You are an academic advisor at Batangas State University "
            "specializing in the BS Computer Engineering program. You understand "
            "the BSU CpE curriculum deeply — you know which subjects map to which "
            "real-world technical skills. You interpret ILO scores using these thresholds: "
            "Exceeding Expectations >= 80%, On Track >= 60%, "
            "Needs Attention >= 40%, Critical < 40%."
        ),
        llm=_get_llm(),
        tools=[student_data_tool],
        verbose=True,
        allow_delegation=False,
    )


def create_academic_analysis_task(agent: Agent) -> Task:
    return Task(
        description=(
            "Use the student_data_lookup tool with query='academic' to fetch "
            "the student's ILO scores across all assessments.\n\n"
            "For each subject/assessment, use this DETERMINISTIC skill mapping "
            "(do not guess or infer — use exactly what is provided):\n\n"
            "{subject_skill_context}\n\n"
            "For each subject:\n"
            "- Get the primary_skills and skillset_categories from the mapping above\n"
            "- Compute average ILO score as percentage: (raw_score / max_score) × 100\n"
            "- Apply threshold: EXCEEDING >= 80, ON TRACK >= 60, "
            "  NEEDS ATTENTION >= 40, CRITICAL < 40\n"
            "- Use ml_predicted_score from the ML model output context if available (Agent 3 will merge them later)\n\n"
            "Return ONLY this JSON — no explanation:\n"
            "{\n"
            '  "academic_skills": [\n'
            "    {\n"
            '      "skill": "Algorithm Design",\n'
            '      "source_subject": "Data Structures and Algorithms",\n'
            '      "primary_skills": ["Algorithm Design", "Data Structures"],\n'
            '      "skillset_categories": ["Programming & Software Development"],\n'
            '      "ilo_scores": {"ILO1": 82, "ILO2": 75},\n'
            '      "avg_score": 78.5,\n'
            '      "status": "ON TRACK",\n'
            '      "ml_predicted_score": 80.2,\n'
            '      "career_relevance": ["Backend Developer", "Software Architect"]\n'
            "    }\n"
            "  ],\n"
            '  "overall_performance": 78.5,\n'
            '  "performance_tier": "Satisfactory",\n'
            '  "top_academic_skills": ["Algorithm Design", "OOP"],\n'
            '  "weak_academic_skills": ["Networking", "Embedded Systems"]\n'
            "}\n"
            "If no academic data exists return:\n"
            "{\n"
            '  "academic_skills": [],\n'
            '  "overall_performance": 0,\n'
            '  "performance_tier": "No Data",\n'
            '  "top_academic_skills": [],\n'
            '  "weak_academic_skills": [],\n'
            '  "note": "No academic scores recorded yet."\n'
            "}\n"
        ),
        expected_output=(
            "A JSON object with keys: academic_skills (list), overall_performance (float), "
            "performance_tier (str), top_academic_skills (list), weak_academic_skills (list). "
            "Return ONLY the JSON."
        ),
        agent=agent,
    )
