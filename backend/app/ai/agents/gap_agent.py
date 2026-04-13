"""
gap_agent.py — Agent 5: Skill Gap Analyst.

Identifies specific skill gaps for the student's top career match
and finds concrete GitHub learning resources for each gap.
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


def create_gap_analyst(rag_career_tool, github_search_tool) -> Agent:
    return Agent(
        role="Skill Gap Analyst",
        goal=(
            "Identify specific skill gaps for the student's top career match "
            "and find concrete learning resources for each gap."
        ),
        backstory=(
            "You are a learning path designer who creates actionable "
            "skill development plans for BSU CpE students. For every skill gap you "
            "find the most relevant GitHub repositories and learning resources. "
            "You are specific — you never say 'learn Docker', you say "
            "'start with this Docker beginner repo and complete these 3 steps'."
        ),
        llm=_get_llm(),
        tools=[rag_career_tool, github_search_tool],
        verbose=True,
        allow_delegation=False,
    )


def create_gap_analysis_task(agent: Agent, career_task) -> Task:
    return Task(
        description=(
            "You have received the career_matches from the Career Mapper as context.\n\n"
            "Focus ONLY on the recommended_career's gap_skills.\n\n"
            "For each gap skill in gap_skills of the recommended career:\n"
            "1. Use rag_career_knowledge with query='[skill] learning resources curriculum' "
            "   to find any relevant knowledge base content\n"
            "2. Use github_search with skill_query='[skill] beginner tutorial' "
            "   to find the top 2 most-starred learning repositories\n"
            "3. Assign a priority: 'high' if the skill appears in > 50% of job postings "
            "   for that career, 'medium' otherwise — use your domain knowledge\n"
            "4. Estimate weeks to acquire based on complexity: "
            "simple tools = 2–3 weeks, frameworks = 4–6 weeks, paradigms = 6–10 weeks\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "gap_analysis": [\n'
            "    {\n"
            '      "skill": "Docker",\n'
            '      "priority": "high",\n'
            '      "reason": "Required for 90% of backend developer job postings",\n'
            '      "learning_resources": [\n'
            "        {\n"
            '          "type": "github_repo",\n'
            '          "title": "docker/getting-started",\n'
            '          "url": "https://github.com/docker/getting-started",\n'
            '          "stars": 12400,\n'
            '          "description": "Official Docker getting started guide"\n'
            "        }\n"
            "      ],\n"
            '      "estimated_weeks": 3\n'
            "    }\n"
            "  ],\n"
            '  "total_gaps": 3,\n'
            '  "estimated_total_weeks": 12\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: gap_analysis (list), total_gaps (int), "
            "estimated_total_weeks (int). Each gap item must include learning_resources "
            "with at least one github_repo entry. Return ONLY the JSON."
        ),
        agent=agent,
        context=[career_task],
    )
