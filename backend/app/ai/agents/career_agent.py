"""
career_agent.py — Agent 4: Career Path Mapper.

Uses the RAG knowledge base to match a student's unified skill profile
to the top 3 relevant BSU CpE career paths with calculated match scores.
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


def create_career_mapper(rag_career_tool) -> Agent:
    return Agent(
        role="Career Path Mapper",
        goal=(
            "Match a BSU CpE student's unified skill profile to relevant "
            "career paths using the RAG knowledge base."
        ),
        backstory=(
            "You are a career counselor specializing in the Philippine "
            "tech industry. You use the knowledge base to find career paths that "
            "match the student's current skills. You are realistic — you report "
            "actual match percentages based on how many required skills the student "
            "already has. You prioritize careers relevant to BSU CpE graduates "
            "in the Philippine job market."
        ),
        llm=_get_llm(),
        tools=[rag_career_tool],
        verbose=True,
        allow_delegation=False,
    )


def create_career_mapping_task(agent: Agent, skill_task) -> Task:
    return Task(
        description=(
            "You have received the unified_skills from the Skill Synthesizer as context.\n"
            "Each skill has a name, proficiency (beginner/intermediate/advanced), and source.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 1 — RUN AT LEAST 3 RAG QUERIES (use rag_career_knowledge)\n"
            "═══════════════════════════════════════════════════════\n"
            "Make these queries with category='career_path' and top_k=5:\n\n"
            "  Query A — Primary stack:\n"
            "    Combine the student's top 3 programming languages + top 2 frameworks.\n"
            "    Example: 'careers for Python FastAPI PostgreSQL React'\n\n"
            "  Query B — Domain area:\n"
            "    Use their dominant skillset category as a query.\n"
            "    Examples: 'embedded systems engineer Philippines',\n"
            "             'machine learning engineer fintech Philippines',\n"
            "             'frontend developer React Philippines'\n\n"
            "  Query C — Project evidence:\n"
            "    If github_skills mentions specific demonstrative work\n"
            "    (e.g., 'RAG chatbot', 'STM32 firmware', 'multi-container Docker'),\n"
            "    query for the career best matching that project shape.\n\n"
            "Collect ALL career titles returned across the 3 queries and dedupe.\n"
            "DO NOT propose careers that did not appear in any RAG result —\n"
            "every career_matches entry must come from the knowledge base.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 2 — WEIGHTED MATCH SCORE (do not use a binary formula)\n"
            "═══════════════════════════════════════════════════════\n"
            "For each candidate career chunk returned by RAG, parse its 'Required skills'\n"
            "list. Then compute a weighted score using these rules:\n\n"
            "  Per required skill, look up the student's proficiency in that skill (or any\n"
            "  alias of it). Award points:\n"
            "    advanced       → 1.0 point\n"
            "    intermediate   → 0.7 point\n"
            "    beginner       → 0.4 point\n"
            "    not present    → 0.0 point\n"
            "    partial / adjacent (e.g. student knows Express, career needs FastAPI)\n"
            "                   → 0.3 point\n\n"
            "  match_score = round(  (sum of awarded points / number of required skills) * 100  )\n\n"
            "  Bonus: if the student has a github project that matches one of the chunk's\n"
            "  'Demonstrative GitHub projects' descriptions, add +5 (capped at 95).\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 3 — SCORE CALIBRATION (interpret the bands honestly)\n"
            "═══════════════════════════════════════════════════════\n"
            "Match scores must land in realistic bands:\n"
            "  85–95: Strong fit. Student already has most skills at intermediate+ level.\n"
            "         Ready to pursue this role with focused gap closure.\n"
            "  65–84: Good fit. Solid foundation, several gaps remain.\n"
            "  45–64: Moderate fit. Real interest signals but significant skill gaps.\n"
            "  25–44: Stretch fit. Could pursue but requires major investment.\n"
            "  < 25:  DO NOT include this career in the output.\n\n"
            "  A perfect 100 is unrealistic for a student — cap at 95.\n"
            "  A 0 is unrealistic too — if a chunk surfaced from RAG, the student has SOME\n"
            "  alignment. Floor at 25 (drop the chunk if true score < 25).\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 4 — POPULATE EACH CAREER MATCH\n"
            "═══════════════════════════════════════════════════════\n"
            "  • title: copy verbatim from the RAG chunk's 'Career Path:' field.\n"
            "  • match_score: integer from Step 2/3.\n"
            "  • matched_skills: skills from the chunk's 'Required skills' list that the\n"
            "    student has at intermediate+ level. Max 6, ordered by importance.\n"
            "  • gap_skills: skills the student lacks or only has at beginner level.\n"
            "    Max 6, ordered by importance.\n"
            "  • reasoning: 1–2 sentences explaining WHY this score, citing specific\n"
            "    skills and proficiencies. Not generic praise. Bad: 'Strong fit for this\n"
            "    role.' Good: 'Strong Python (advanced) and FastAPI (intermediate) align\n"
            "    with the backend stack; Docker and Redis are the main gaps.'\n"
            "  • roadmap_url: copy verbatim from the chunk's 'Roadmap:' line.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 5 — SELECT TOP 3 + RECOMMENDED CAREER\n"
            "═══════════════════════════════════════════════════════\n"
            "Sort all valid candidates (score >= 25) by match_score descending.\n"
            "Return the top 3.\n\n"
            "  Tie-breaking when match_scores are within 3 points of each other:\n"
            "    1. Prefer the career with stronger Philippine market outlook\n"
            "       (look at the chunk's 'Philippine market outlook' line).\n"
            "    2. Then prefer the career with fewer gap_skills (closer to job-ready).\n\n"
            "  recommended_career = title of the #1 result.\n\n"
            "  If fewer than 3 careers score >= 25, return however many qualify\n"
            "  (1, 2, or 3 entries). DO NOT pad with low-confidence picks.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "OUTPUT (return ONLY this JSON, no explanation text)\n"
            "═══════════════════════════════════════════════════════\n"
            "{\n"
            '  "career_matches": [\n'
            "    {\n"
            '      "title": "Backend Developer",\n'
            '      "match_score": 78,\n'
            '      "matched_skills": ["Python", "FastAPI", "PostgreSQL", "Git"],\n'
            '      "gap_skills": ["Docker", "Redis", "CI/CD"],\n'
            '      "reasoning": "Advanced Python and intermediate FastAPI/PostgreSQL cover the core backend stack; missing containerization and caching layers.",\n'
            '      "roadmap_url": "https://roadmap.sh/backend"\n'
            "    }\n"
            "  ],\n"
            '  "recommended_career": "Backend Developer"\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: career_matches (list of up to 3 careers with "
            "match_score >= 25, sorted by match_score desc; each must come from a RAG "
            "result), recommended_career (str — the title of the top match). "
            "Return ONLY the JSON."
        ),
        agent=agent,
        context=[skill_task],
    )
