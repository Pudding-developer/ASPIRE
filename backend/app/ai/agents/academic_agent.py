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
        max_retries=2,
        timeout=300,
        temperature=0,
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

            "DETERMINISTIC subject → skill mapping you MUST use (do not guess,\n"
            "do not invent skills, do not paraphrase the skill names):\n\n"
            "{subject_skill_context}\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 1 — COMPUTE PER-SUBJECT AVERAGE\n"
            "═══════════════════════════════════════════════════════\n"
            "Group the student's scores by source_subject (Assessment.name).\n"
            "Within each subject:\n"
            "  • Each row already provides percentage = (score / max_score) × 100.\n"
            "  • Group by ilo_number. If a single ILO has multiple assessments,\n"
            "    average those percentages first to get one ILO score per ILO number.\n"
            "  • avg_score = mean of all ILO percentages for that subject, rounded\n"
            "    to one decimal place.\n"
            "  • ilo_scores = the per-ILO map (e.g., {\"ILO1\": 82, \"ILO2\": 75}),\n"
            "    rounded to integer.\n\n"
            "Skip subjects that have no scores at all.\n"
            "Skip subjects whose name does NOT appear in the mapping above —\n"
            "do not invent a mapping for unknown subjects.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 2 — CLASSIFY STATUS (strict thresholds)\n"
            "═══════════════════════════════════════════════════════\n"
            "Apply EXACTLY this mapping based on avg_score:\n"
            "    avg_score >= 80   →  status = \"EXCEEDING\"\n"
            "    avg_score >= 60   →  status = \"ON TRACK\"\n"
            "    avg_score >= 40   →  status = \"NEEDS ATTENTION\"\n"
            "    avg_score <  40   →  status = \"CRITICAL\"\n\n"
            "Do not invent intermediate statuses. Do not soften CRITICAL.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 3 — POPULATE FIELDS PER SUBJECT (verbatim from mapping)\n"
            "═══════════════════════════════════════════════════════\n"
            "  • skill: use the FIRST primary_skill from the mapping (most representative).\n"
            "  • source_subject: the subject's name as it appears in scores.\n"
            "  • primary_skills: copy verbatim from the mapping.\n"
            "  • skillset_categories: copy verbatim from the mapping.\n"
            "  • ilo_scores: from Step 1.\n"
            "  • avg_score: from Step 1.\n"
            "  • status: from Step 2.\n"
            "  • ml_predicted_score: copy from ML model output if present in context;\n"
            "    otherwise set to null.\n"
            "  • career_relevance: derive ONLY by mapping the skillset_categories to\n"
            "    careers the knowledge base associates with them. Do NOT invent careers.\n"
            "    If you are unsure for a category, use an empty list.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 4 — OVERALL METRICS\n"
            "═══════════════════════════════════════════════════════\n"
            "  • overall_performance: weighted mean of avg_score across all subjects,\n"
            "    weighted by the number of ILOs in each subject. Round to one decimal.\n"
            "  • performance_tier: by overall_performance band:\n"
            "        >= 85   →  \"Outstanding\"\n"
            "        >= 70   →  \"Strong\"\n"
            "        >= 60   →  \"Satisfactory\"\n"
            "        >= 50   →  \"Developing\"\n"
            "        <  50   →  \"At Risk\"\n"
            "  • top_academic_skills: take the FIRST primary_skill from each subject,\n"
            "    sorted by that subject's avg_score DESCENDING. Keep the top 5.\n"
            "    Dedupe — if two subjects share a skill, keep only the highest score.\n"
            "  • weak_academic_skills: same source list, sorted ASCENDING by avg_score.\n"
            "    Keep the bottom 5. Dedupe the same way.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 5 — EMPTY DATA HANDLING\n"
            "═══════════════════════════════════════════════════════\n"
            "If the student has zero academic_scores, return exactly:\n"
            "{\n"
            '  "academic_skills": [],\n'
            '  "overall_performance": 0,\n'
            '  "performance_tier": "No Data",\n'
            '  "top_academic_skills": [],\n'
            '  "weak_academic_skills": [],\n'
            '  "note": "No academic scores recorded yet."\n'
            "}\n\n"

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
            '  "performance_tier": "Strong",\n'
            '  "top_academic_skills": ["Algorithm Design", "OOP"],\n'
            '  "weak_academic_skills": ["Networking", "Embedded Systems"]\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: academic_skills (one entry per subject WITH "
            "scores AND a known mapping), overall_performance (float, weighted by "
            "ILO count), performance_tier (one of: Outstanding/Strong/Satisfactory/"
            "Developing/At Risk/No Data), top_academic_skills (top 5 by avg_score "
            "desc, deduped), weak_academic_skills (bottom 5 by avg_score asc, deduped). "
            "Return ONLY the JSON."
        ),
        agent=agent,
    )
