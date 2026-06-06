"""
career_agent.py — Agent 4: Career Path Mapper.

Uses the RAG knowledge base to score the student's unified skill profile
against EVERY BSU CpE career path in the knowledge base (not just a top-N).
Returns one entry per career so the UI can render a stable, deterministic
match score for any pinned card.
"""
from crewai import Agent, LLM
from crewai import Task

from app.core.config import GEMINI_MODEL


def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        max_retries=2,
        timeout=300,
        temperature=0.0,
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
            "STEP 1 — RETRIEVE EVERY CAREER PATH IN THE KNOWLEDGE BASE\n"
            "═══════════════════════════════════════════════════════\n"
            "You MUST strictly follow this sequential, step-by-step procedure for querying RAG:\n"
            "  1. Execute tool call A: rag_career_knowledge(query='BSU Computer Engineering career paths Philippines', category='career_path', top_k=30) and wait for the response.\n"
            "  2. Execute tool call B: rag_career_knowledge(query='Full Stack Backend Frontend AI Engineer Data Scientist Machine Learning', category='career_path', top_k=30) and wait for the response.\n"
            "  3. Execute tool call C: rag_career_knowledge(query='DevOps Cybersecurity Embedded Systems Network Engineer IoT', category='career_path', top_k=30) and wait for the response.\n"
            "  4. Parse the text contents of every chunk returned. Locate the line starting with 'Career Path: <Title>'.\n"
            "  5. Combine all chunks from A, B, and C. Deduplicate them by the exact title (case-insensitive) — keep the first occurrence of each unique title.\n"
            "  6. Every career in your final output MUST come from this RAG-derived candidate set. Do NOT hallucinate, invent, or add any careers not present in these results.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 2 — WEIGHTED MATCH SCORE (do not use a binary formula)\n"
            "═══════════════════════════════════════════════════════\n"
            "For each candidate career chunk returned by RAG, parse its 'Required skills'\n"
            "list. Then compute a weighted score using these rules:\n\n"
            "  Per required skill, look up the student's proficiency in that skill (or any\n"
            "  alias of it). Award points based on their status or final_score:\n"
            "    advanced / EXCEEDING EXPECTATIONS / final_score >= 80  → 1.0 point\n"
            "    intermediate / ON TRACK / final_score >= 60           → 0.7 point\n"
            "    beginner / NEEDS ATTENTION / final_score >= 40        → 0.4 point\n"
            "    critical / CRITICAL / final_score < 40                → 0.2 point (exposure / basic familiarity)\n"
            "    not present (absent from profile)                     → 0.0 point\n"
            "    partial / adjacent (e.g. student knows Express, career needs FastAPI)\n"
            "                                                           → 0.3 point\n\n"
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
            "  A perfect 100 is unrealistic for a student — cap at 95.\n"
            "  Include ALL careers even if the score is very low (e.g., 0). Do not drop them.\n\n"

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
            "STEP 5 — RETURN EVERY VIABLE CAREER + RECOMMEND THE TOP\n"
            "═══════════════════════════════════════════════════════\n"
            "Score every unique career from Step 1. Include in `career_matches`\n"
            "every career, regardless of its score. Do NOT drop careers with low scores.\n"
            "Sort the list by match_score descending.\n\n"
            "  Tie-breaking when match_scores are within 3 points of each other:\n"
            "    1. Prefer the career with stronger Philippine market outlook\n"
            "       (look at the chunk's 'Philippine market outlook' line).\n"
            "    2. Then prefer the career with fewer gap_skills (closer to job-ready).\n\n"
            "  recommended_career = title of the #1 (highest-scoring) result.\n\n"

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
            "A JSON object with keys: career_matches (list of EVERY career "
            "scored — typically 6–12 entries depending on how many career "
            "paths are in the knowledge base — sorted by match_score desc; each "
            "must come from a RAG result), recommended_career (str — the title "
            "of the top match). Return ONLY the JSON."
        ),
        agent=agent,
        context=[skill_task],
    )
