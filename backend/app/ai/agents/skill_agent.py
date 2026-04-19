"""
skill_agent.py — Agent 3: Skill Profile Synthesizer.

Merges GitHub skills (Agent 1) and academic skills (Agent 2) into
a single unified profile using weighted scoring:
  GitHub contribution = 40%
  Academic performance = 60%
"""
from crewai import Agent, LLM
from crewai import Task

from app.core.config import GEMINI_API_KEY, GEMINI_MODEL


def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        api_key=GEMINI_API_KEY,
        max_retries=5,
        timeout=120
    )


def create_skill_synthesizer() -> Agent:
    return Agent(
        role="Skill Profile Synthesizer",
        goal=(
            "Combine GitHub technical skills and academic performance data "
            "into a single unified student skill profile with weighted confidence scores."
        ),
        backstory=(
            "You are a senior technical recruiter who evaluates both "
            "academic credentials and real-world coding portfolios. You know that "
            "practical GitHub work carries 40% weight and academic performance carries "
            "60% weight when assessing a BSU CpE student's readiness. You reconcile "
            "conflicts between the two sources — if a student has strong GitHub Python "
            "skills but weak academic scores in programming, you report both honestly."
        ),
        llm=_get_llm(),
        tools=[],
        verbose=True,
        allow_delegation=False,
    )


def create_skill_synthesis_task(
    agent: Agent,
    github_task,
    academic_task,
) -> Task:
    return Task(
        description=(
            "You have received the output of the GitHub Analyst (github_skills) "
            "and the Academic Analyst (academic_skills) as context.\n\n"
            "Merge both into a unified skill profile using this weighting:\n"
            "  GitHub score → 40% weight\n"
            "  Academic score → 60% weight\n\n"
            "Rules:\n"
            "- For skills present in BOTH sources: "
            "final_score = (github_score * 0.4) + (academic_score * 0.6). "
            "Convert GitHub proficiency to a numeric score first: "
            "beginner=50, intermediate=75, advanced=90.\n"
            "- For skills in ONLY one source: use that score directly, mark source accordingly.\n"
            "- Apply status thresholds to final_score: "
            "EXCEEDING EXPECTATIONS >= 80, ON TRACK >= 60, "
            "NEEDS ATTENTION >= 40, CRITICAL < 40.\n"
            "- strongest_skills = top 3 by final_score\n"
            "- weakest_skills = bottom 3 by final_score\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "fusion_weights": {"academic": 0.7, "github": 0.3},\n'
            '  "unified_skills": [\n'
            "    {\n"
            '      "skill": "Python",\n'
            '      "category": "Programming Languages",\n'
            '      "final_score": 84.5,\n'
            '      "github_score": 75,\n'
            '      "academic_score": 91,\n'
            '      "status": "EXCEEDING EXPECTATIONS",\n'
            '      "source": "both"\n'
            "    }\n"
            "  ],\n"
            '  "skill_summary": {\n'
            '    "total_skills": 12,\n'
            '    "exceeding": 4,\n'
            '    "on_track": 5,\n'
            '    "needs_attention": 2,\n'
            '    "critical": 1\n'
            '  },\n'
            '  "strongest_skills": ["Python", "FastAPI", "Algorithm Design"],\n'
            '  "weakest_skills": ["Networking", "Embedded Systems", "DevOps"],\n'
            '  "note": null\n'
            "}\n\n"
            "If academic_skills is empty or performance_tier is \"No Data\",\n"
            "synthesize skills from GitHub data only. Set source=\"github_only\", "
            "apply 100% GitHub weight, and set fusion_weights to {\"academic\": 0.0, \"github\": 1.0}.\n\n"
            "If github_skills is empty or missing, synthesize skills from academic data only. "
            "Set source=\"academic_only\", apply 100% academic weight, and set "
            "fusion_weights to {\"academic\": 1.0, \"github\": 0.0}. Add a note explaining this.\n\n"
            "Still produce a complete valid JSON output."
        ),
        expected_output=(
            "A JSON object with keys: fusion_weights (object), unified_skills (list), "
            "skill_summary (object), strongest_skills (list), weakest_skills (list). "
            "Return ONLY the JSON."
        ),
        agent=agent,
        context=[github_task, academic_task],
    )
