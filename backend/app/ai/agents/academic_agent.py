"""
academic_agent.py — Agent 2: Academic Performance Analyst.

Analyzes a student's ILO scores and ML model predictions to produce
a subject-mapped academic skill profile with threshold classifications.
"""
from crewai import Agent, LLM
from crewai import Task

from app.core.config import GEMINI_API_KEY


def _get_llm() -> LLM:
    return LLM(
        model="gemini/gemini-2.5-flash",
        api_key=GEMINI_API_KEY,
        max_retries=3,
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
            "Use the student_data_lookup tool with query='academic' to fetch the student's "
            "ILO scores across all assessments.\n\n"
            "For each subject/assessment:\n"
            "- Group ILO scores by assessment name to identify the subject\n"
            "- Map the subject to a real-world technical skill "
            "(e.g., 'Data Structures' → 'Algorithm Design', "
            "'Electronics Circuits' → 'Circuit Analysis', "
            "'Programming 1/2' → 'Object-Oriented Programming')\n"
            "- Compute the average ILO score across all ILOs for that assessment\n"
            "- Apply threshold classification:\n"
            "  EXCEEDING EXPECTATIONS >= 80%\n"
            "  ON TRACK >= 60%\n"
            "  NEEDS ATTENTION >= 40%\n"
            "  CRITICAL < 40%\n\n"
            "Compute overall_performance as the average of all assessment averages.\n"
            "Assign performance_tier: Distinction >= 85%, Satisfactory >= 70%, "
            "Developing >= 55%, At Risk < 55%.\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "academic_skills": [\n'
            "    {\n"
            '      "skill": "Algorithm Design",\n'
            '      "source_subject": "Data Structures and Algorithms",\n'
            '      "ilo_scores": {"ILO1": 82, "ILO2": 75, "ILO3": 90, "ILO4": 88},\n'
            '      "avg_score": 83.75,\n'
            '      "status": "EXCEEDING EXPECTATIONS",\n'
            '      "ml_predicted_score": 87.2\n'
            "    }\n"
            "  ],\n"
            '  "overall_performance": 80.3,\n'
            '  "performance_tier": "Satisfactory",\n'
            '  "top_academic_skills": ["Algorithm Design", "OOP"],\n'
            '  "weak_academic_skills": ["Networking", "Embedded Systems"]\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: academic_skills (list), overall_performance (float), "
            "performance_tier (str), top_academic_skills (list), weak_academic_skills (list). "
            "Return ONLY the JSON."
        ),
        agent=agent,
    )
