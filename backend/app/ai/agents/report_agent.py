"""
report_agent.py — Agent 6: Career Report Generator.

Synthesizes all previous agent outputs into the final CareerReport JSON
that matches the schema the frontend already expects.
"""
from crewai import Agent
from crewai import Task

from app.ai.llm_factory import get_llm


def create_report_generator() -> Agent:
    return Agent(
        role="Career Report Generator",
        goal=(
            "Synthesize all previous agent outputs into a final comprehensive "
            "career readiness report for the student."
        ),
        backstory=(
            "You are a professional report writer who creates clear, "
            "encouraging, and actionable career readiness reports for BSU CpE students. "
            "You synthesize technical analysis into human-readable insights. "
            "You are honest about weaknesses but always frame them as opportunities. "
            "Your reports are read by students, so use clear language — no jargon."
        ),
        llm=get_llm(),
        tools=[],
        verbose=True,
        allow_delegation=False,
        max_iter=3,
        max_retry_limit=2,
    )


def create_report_generation_task(
    agent: Agent,
    github_task,
    academic_task,
    skill_task,
    career_task,
    gap_task,
) -> Task:
    return Task(
        description=(
            "You have received all previous agent outputs as context:\n"
            "  - github_skills (Agent 1 — GitHub Analyst)\n"
            "  - academic_skills (Agent 2 — Academic Analyst)\n"
            "  - unified_skills (Agent 3 — Skill Synthesizer)\n"
            "  - recommended_careers (Agent 4 — Career Mapper)\n"
            "  - gap_analysis (Agent 5 — Gap Analyst)\n\n"
            "Produce the final CareerReport JSON.\n\n"
            "Rules:\n"
            "- recommended_careers: take from Agent 4, enhanced by adding the gap data "
            "  for the top recommended career from Agent 5\n"
            "- recommendations: write 3–5 specific, actionable items derived from the "
            "  gap_analysis. Each must reference a specific resource or step "
            "  (e.g., 'Complete the Docker getting-started tutorial — estimated 3 weeks')\n"
            "- summary: write a 2–3 paragraph career readiness summary in plain English. "
            "  Mention the student's strongest skills, recommended career, and top 2 gaps. "
            "  Be encouraging but honest. No bullet points — flowing paragraphs only.\n"
            "- skill_profile: take unified_skills, skill_summary, strongest_skills, "
            "  weakest_skills directly from Agent 3 output\n"
            "- gap_analysis: take directly from Agent 5 output\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "recommended_careers": [...],\n'
            '  "recommendations": [\n'
            '    "Complete the Docker getting started tutorial (3 weeks)...",\n'
            '    "Build a REST API project using FastAPI and deploy to Render..."\n'
            "  ],\n"
            '  "summary": "2-3 paragraph career readiness summary in plain English",\n'
            '  "skill_profile": {\n'
            '    "unified_skills": [...],\n'
            '    "skill_summary": {...},\n'
            '    "strongest_skills": [...],\n'
            '    "weakest_skills": [...]\n'
            "  },\n"
            '  "gap_analysis": [...]\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: recommended_careers, recommendations, summary, "
            "skill_profile, gap_analysis. "
            "This is the final output that will be stored in CareerReport.report_json "
            "and read by the frontend. Return ONLY the JSON."
        ),
        agent=agent,
        context=[github_task, academic_task, skill_task, career_task, gap_task],
    )
