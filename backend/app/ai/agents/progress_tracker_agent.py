"""
progress_tracker_agent.py — Longitudinal Progress Tracker.

Compares current pipeline results with previous report data to calculate growth.
"""
from crewai import Agent, Task, LLM
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL

def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        api_key=GEMINI_API_KEY,
        max_retries=5,
        timeout=120
    )

def create_progress_tracker() -> Agent:
    return Agent(
        role="Longitudinal Progress Tracker",
        goal="Compare the current pipeline results with the student's previous CareerReport to calculate growth and changes",
        backstory=(
            "You are a career development analyst who specializes in tracking student "
            "progress over time at BSU CpE. You identify what has improved, what has "
            "regressed, and what new gaps have emerged since the last assessment."
        ),
        llm=_get_llm(),
        verbose=True,
        allow_delegation=False
    )

def create_progress_tracking_task(agent: Agent, current_report_task) -> Task:
    return Task(
        description=(
            "You have received the current report results and the student's previous report data as context.\n\n"
            "1. Compare the current skill profile and career matching scores against the previous report.\n"
            "2. Identify:\n"
            "   - readiness_score_change: current overall career readiness minus previous score.\n"
            "   - new_skills_gained: skills that are present in the current profile but were missing in the previous one.\n"
            "   - gaps_closed: skill gaps that were identified in the previous report but are no longer present.\n"
            "   - new_gaps: new skill gaps that have appeared since the last assessment.\n"
            "   - trend: 'improving', 'stable', or 'declining' based on the readiness score and gaps.\n\n"
            "Return ONLY a JSON object in this exact schema:\n"
            "{\n"
            '  "readiness_score_change": 5.2,\n'
            '  "new_skills_gained": ["Docker", "REST APIs"],\n'
            '  "gaps_closed": ["Python Basics"],\n'
            '  "new_gaps": ["Kubernetes"],\n'
            '  "trend": "improving",\n'
            '  "summary": "One sentence describing overall progress"\n'
            "}\n\n"
            "If no previous report exists (previous_report_json is null or empty),\n"
            "return this exact JSON:\n"
            "{\n"
            '  "readiness_score_change": 0,\n'
            '  "new_skills_gained": [],\n'
            '  "gaps_closed": [],\n'
            '  "new_gaps": [],\n'
            '  "trend": "baseline",\n'
            '  "summary": "This is the student\'s first career readiness assessment."\n'
            "}"
        ),
        expected_output="A single JSON object containing readiness_score_change, new_skills_gained, gaps_closed, new_gaps, trend, and summary. Return ONLY valid JSON.",
        agent=agent,
        context=[current_report_task]
    )
