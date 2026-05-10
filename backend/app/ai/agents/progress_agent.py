"""
progress_agent.py — Agent 7: Student Progress Tracker.

Compares the current report against the student's previous CareerReport
to measure real growth, close gaps, and produce a motivational progression summary.

If this is the student's first report, produces an encouraging baseline instead.
"""
from crewai import Agent, LLM
from crewai import Task

from app.core.config import GEMINI_MODEL


def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        max_retries=2,
        timeout=300,
        temperature=0.2,
        thinking={"type": "enabled", "budget_tokens": 1024},
    )


def create_progress_tracker() -> Agent:
    return Agent(
        role="Student Progress Tracker",
        goal=(
            "Compare current skill profile against previous report "
            "to measure real growth since the last analysis."
        ),
        backstory=(
            "You are a student success coach at Batangas State University "
            "tracking BSU CpE student career development over time. "
            "You compare before-and-after skill profiles to identify genuine improvements. "
            "You celebrate wins — even small ones. "
            "You are specific: never say 'you improved' — say "
            "'your Python score grew from 72% to 85% because you pushed "
            "3 new FastAPI projects this semester'. "
            "If this is the student's first report produce an encouraging "
            "baseline summary instead of a comparison."
        ),
        llm=_get_llm(),
        tools=[],
        verbose=True,
        allow_delegation=False,
    )


def create_progress_tracking_task(agent: Agent, report_task) -> Task:
    return Task(
        description=(
            "You have received as context:\n"
            "  - The full output from Agent 6 (current report — career_matches, "
            "    skill_profile, gap_analysis, recommendations, summary)\n"
            "  - previous_report_json: the student's previous CareerReport as a JSON string "
            "    (will be 'null' if this is the first run)\n"
            "  - chosen_career: the student's chosen career from their profile "
            "    (use recommended_career from Agent 4 if this is null)\n"
            "  - days_since_last_report: integer number of days since last report "
            "    (will be 'null' if this is the first run)\n\n"
            "CASE 1 — previous_report_json is null (FIRST RUN):\n"
            "  - Set first_run: true\n"
            "  - Set career_readiness_score to the recommended_career's match_score from Agent 4\n"
            "  - Set previous_readiness_score: 0, readiness_change: 0\n"
            "  - Set days_since_last_report: null\n"
            "  - Set closed_gaps, improved_skills, new_skills_detected to []\n"
            "  - Set remaining_gaps from the recommended career's gap_skills\n"
            "  - Set next_milestone to the highest-priority single gap skill\n"
            "  - Write an encouraging first-time motivational_insight (2 sentences max)\n"
            "  - Write a short baseline semester_summary\n\n"
            "CASE 2 — previous_report_json is not null (RETURNING STUDENT):\n"
            "  Compare current vs previous report:\n"
            "  - career_readiness_score: current recommended_career match_score\n"
            "  - previous_readiness_score: previous report's same career match_score "
            "    (or 0 if career changed)\n"
            "  - readiness_change: current - previous\n"
            "  - closed_gaps: skills that were in previous gap_skills but are NOT in "
            "    current gap_skills for the chosen career\n"
            "  - remaining_gaps: skills still in current gap_skills\n"
            "  - new_skills_detected: skills in current unified_skills that were NOT "
            "    in the previous report's skill_profile\n"
            "  - improved_skills: unified skills where current final_score > previous score. "
            "    Include skill name, previous_score, current_score, change, and a specific "
            "    reason citing GitHub or academic evidence from the context (be specific).\n"
            "  - next_milestone: the single remaining gap skill that has the highest career "
            "    impact AND requires the fewest weeks to acquire\n"
            "  - motivational_insight: 1–2 sentences specific to this student's progress. "
            "    Never generic — always cite specific skill changes and timeframe.\n"
            "  - semester_summary: 1 sentence summarizing the semester in plain English\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "first_run": false,\n'
            '  "chosen_career": "Backend Developer",\n'
            '  "career_readiness_score": 67,\n'
            '  "previous_readiness_score": 55,\n'
            '  "readiness_change": 12,\n'
            '  "days_since_last_report": 21,\n'
            '  "closed_gaps": ["Docker", "Git workflows"],\n'
            '  "remaining_gaps": ["Redis", "CI/CD", "AWS basics"],\n'
            '  "new_skills_detected": ["Docker Compose", "GitHub Actions"],\n'
            '  "improved_skills": [\n'
            "    {\n"
            '      "skill": "Python",\n'
            '      "previous_score": 72,\n'
            '      "current_score": 85,\n'
            '      "change": 13,\n'
            '      "reason": "3 new FastAPI repositories pushed this semester"\n'
            "    }\n"
            "  ],\n"
            '  "unchanged_skills": ["JavaScript", "SQL"],\n'
            '  "next_milestone": {\n'
            '    "skill": "Redis",\n'
            '    "impact": "Will increase readiness to 75%",\n'
            '    "estimated_weeks": 2,\n'
            '    "recommended_repo": "https://github.com/redis/redis"\n'
            "  },\n"
            '  "motivational_insight": "You have grown significantly in the past 21 days. At this pace you will be Backend Developer ready in approximately 8 weeks.",\n'
            '  "semester_summary": "Strong semester — 2 gaps closed, 3 skills improved significantly."\n'
            "}\n\n"
            "If academic_skills is empty, note in motivational_insight:\n"
            "\"Your career analysis is based on your GitHub activity only. "
            "Ask your instructor to enter your ILO scores for a more "
            "complete career readiness assessment.\""
        ),
        expected_output=(
            "A JSON object with keys: first_run, chosen_career, career_readiness_score, "
            "previous_readiness_score, readiness_change, days_since_last_report, "
            "closed_gaps, remaining_gaps, new_skills_detected, improved_skills, "
            "unchanged_skills, next_milestone, motivational_insight, semester_summary. "
            "Return ONLY the JSON."
        ),
        agent=agent,
        context=[report_task],
    )
