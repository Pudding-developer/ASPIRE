"""
career_agent.py — Agent 4: Career Path Mapper.

Uses the RAG knowledge base to match a student's unified skill profile
to the top 3 relevant BSU CpE career paths with calculated match scores.
"""
from crewai import Agent
from crewai import Task

from app.ai.llm_factory import get_llm


def create_career_mapper(rag_career_tool) -> Agent:
    return Agent(
        role="Career Path Mapper",
        goal=(
            "Match a BSU CpE student's unified skill profile to relevant "
            "career paths using the RAG knowledge base."
        ),
        backstory=(
            "You are a career counselor specializing in the Philippine "
            "tech industry. You bridge the gap between academic curricula and industry "
            "expectations. You use the knowledge base to identify which skills for a career "
            "are already covered by the student's BSU CpE ILO scores and which ones are "
            "entirely missing from their academic path. You are realistic — you report "
            "actual match percentages and prioritize identifies 'Industry Gaps' that the "
            "university curriculum might not cover."
        ),
        llm=get_llm(),
        tools=[rag_career_tool],
        verbose=True,
        allow_delegation=False,
        max_iter=5,
        max_retry_limit=2,
    )


def create_career_mapping_task(agent: Agent, skill_task) -> Task:
    return Task(
        description=(
            "You have received the unified_skills from the Skill Synthesizer and the student's "
            "chosen_career (if any) as context.\n\n"
            "STEP 1: Make EXACTLY ONE call to rag_career_knowledge with category='career_path', "
            "top_k=5, and a query string built from the student's top 3-5 strongest skills "
            "(e.g. 'Python React PostgreSQL FastAPI REST API'). This single call returns all "
            "the career paths you need — do NOT make follow-up queries for the same careers, "
            "and do NOT query for individual career titles you have already received.\n\n"
            "STEP 2: From the returned results, extract the 'Required skills:' line for each "
            "career. For each career, compute:\n"
            "  matched_skills   = skills from the student's unified_skills that appear in the career's required list\n"
            "  gap_skills       = required skills NOT present in the student's unified_skills\n"
            "  match_score      = round((len(matched_skills) / total_required_skills) * 100)\n"
            "  roadmap_url      = the URL printed after 'Roadmap:' in the career's content\n\n"
            "STEP 3: Build the final list of exactly 3 careers:\n"
            "  - If chosen_career is provided (not 'null'), it MUST be the first item. If it is "
            "    not in the RAG results, call rag_career_knowledge ONE more time with "
            "    query=chosen_career and top_k=1 to retrieve its required skills; then compute "
            "    its scores the same way.\n"
            "  - Fill the remaining slots with the highest-scoring careers from the RAG results, "
            "    sorted by match_score descending. Skip duplicates of the chosen_career.\n\n"
            "HARD LIMITS: You may call rag_career_knowledge at most TWICE total across this task. "
            "After you have the data you need, return the JSON immediately — do not keep querying.\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "recommended_careers": [\n'
            "    {\n"
            '      "career_name": "Backend Developer",\n'
            '      "match_score": 85,\n'
            '      "reasoning": "Strong backend foundation with FastAPI and PostgreSQL...",\n'
            '      "gap_skills": ["Docker", "Kubernetes", "CI/CD"],\n'
            '      "matched_skills": ["Python", "FastAPI", "PostgreSQL"],\n'
            '      "roadmap_url": "https://roadmap.sh/backend"\n'
            "    }\n"
            "  ],\n"
            '  "recommended_career": "Backend Developer"\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: recommended_careers (list of top 3, sorted by match_score desc), "
            "recommended_career (str — the title of the highest match). Each item in recommended_careers "
            "MUST have a 'gap_skills' array. Return ONLY the JSON."
        ),
        agent=agent,
        context=[skill_task],
    )
