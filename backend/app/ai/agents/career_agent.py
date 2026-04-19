"""
career_agent.py — Agent 4: Career Path Mapper.

Uses the RAG knowledge base to match a student's unified skill profile
to the top 3 relevant BSU CpE career paths with calculated match scores.
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
            "You have received the unified_skills from the Skill Synthesizer as context.\n\n"
            "Use the rag_career_knowledge tool to find career paths that best match "
            "the student's strongest skills. Make at least 3 separate queries:\n"
            "1. Query using the student's top programming languages and frameworks\n"
            "2. Query using their dominant domain area (e.g., 'embedded systems engineer Philippines')\n"
            "3. Query for alternative career paths based on secondary skills\n\n"
            "For each career path returned by the RAG tool, calculate:\n"
            "  match_score = (number of required skills student already has / "
            "total required skills for that career) * 100\n\n"
            "Return the top 3 matches sorted by match_score descending.\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "career_matches": [\n'
            "    {\n"
            '      "title": "Backend Developer",\n'
            '      "match_score": 87,\n'
            '      "matched_skills": ["Python", "FastAPI", "PostgreSQL"],\n'
            '      "gap_skills": ["Docker", "Redis", "CI/CD"],\n'
            '      "reasoning": "Strong backend foundation with FastAPI and PostgreSQL...",\n'
            '      "roadmap_url": "https://roadmap.sh/backend"\n'
            "    }\n"
            "  ],\n"
            '  "recommended_career": "Backend Developer"\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: career_matches (list of top 3, sorted by match_score desc), "
            "recommended_career (str — the title of the highest match). Return ONLY the JSON."
        ),
        agent=agent,
        context=[skill_task],
    )
