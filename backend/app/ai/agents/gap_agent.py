"""
gap_agent.py — Agent 5: Skill Gap Analyst.

Identifies specific skill gaps for the student's top career match
and finds concrete GitHub learning resources for each gap.
"""
from crewai import Agent
from crewai import Task

from app.ai.llm_factory import get_llm
from app.ai.tools.github_search_tool import GitHubSearchTool


def create_gap_analyst(rag_career_tool, github_search_tool) -> Agent:
    return Agent(
        role="Skill Gap Analyst",
        goal=(
            "Identify specific skill gaps for the student's top career match "
            "and find concrete learning resources for each gap."
        ),
        backstory=(
            "You are a learning path designer who creates actionable "
            "skill development plans for BSU CpE students. You specialize in "
            "identifying 'Curriculum Gaps' — skills required by the industry that "
            "are not explicitly covered by university subjects (ILOs/SOs). For these gaps, "
            "you find the most relevant GitHub repositories and learning resources. "
            "You are specific — you never say 'learn Docker', you say "
            "'start with this Docker beginner repo and complete these 3 steps'."
        ),
        llm=get_llm(),
        tools=[rag_career_tool, github_search_tool],
        verbose=True,
        allow_delegation=False,
        max_iter=10,
        max_retry_limit=2,
    )


def create_gap_analysis_task(agent: Agent, career_task) -> Task:
    return Task(
        description=(
            "You have received the recommended_careers from the Career Mapper and the student's "
            "chosen_career (if any) as context.\n\n"
            "If the student has a chosen_career and it appears in recommended_careers, "
            "perform the gap analysis specifically for THAT career path.\n"
            "Identify which skills are 'Curriculum Gaps' (not covered by the student's ILOs/SOs) "
            "and prioritize finding external resources for them.\n"
            "Otherwise, focus on the first item in the recommended_careers[0].gap_skills array.\n\n"
            "Process AT MOST the first 3 skills in the target career's gap_skills array. "
            "For each of those skills (and each skill ONLY ONCE):\n"
            "1. Call rag_career_knowledge EXACTLY ONCE with query='[skill] learning resources curriculum'\n"
            "2. Call github_search EXACTLY ONCE with skill_name='[skill]' to retrieve top 2 repos\n"
            "3. Assign a priority: 'high' if the skill appears in > 50% of job postings "
            "   for that career, 'medium' otherwise — use your domain knowledge\n"
            "4. Estimate weeks to acquire based on complexity: "
            "simple tools = 2–3 weeks, frameworks = 4–6 weeks, paradigms = 6–10 weeks\n\n"
            "STRICT RULES to prevent looping:\n"
            "- Never call the same tool with the same arguments twice.\n"
            "- Never re-query a skill you have already processed (do NOT retry with variants "
            "like '[skill]-tutorial', '[skill] for beginners', etc.). As soon as github_search "
            "returns ANY result for a skill, accept those repos and move on to the next skill.\n"
            "- Once you have the data for every skill you chose to process, STOP calling tools "
            "and output the Final Answer JSON immediately.\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "gap_analysis": [\n'
            "    {\n"
            '      "skill": "Docker",\n'
            '      "priority": "high",\n'
            '      "reason": "Required for 90% of backend developer job postings",\n'
            '      "resources": [\n'
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
            "estimated_total_weeks (int). Each gap item must include a 'resources' "
            "list with at least one real GitHub repository URL found via GitHubSearchTool. "
            "Return ONLY the JSON."
        ),
        agent=agent,
        context=[career_task],
    )
