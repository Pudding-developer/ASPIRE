"""
gap_agent.py — Agent 5: Skill Gap Analyst.

Identifies specific skill gaps for the student's top career match
and finds concrete GitHub learning resources for each gap.
"""
from crewai import Agent, LLM
from crewai import Task

from app.core.config import GEMINI_MODEL
from app.ai.tools.github_search_tool import GitHubSearchTool


def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        max_retries=2,
        timeout=300,
        temperature=0,
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
            "You have received the career_matches from the Career Mapper as context.\n"
            "Focus ONLY on the recommended_career's gap_skills.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 1 — BUILD THE GAP SET (cap, dedupe, prioritize)\n"
            "═══════════════════════════════════════════════════════\n"
            "Take the gap_skills list from the recommended career. Then:\n"
            "  • Dedupe variants — 'CI/CD' and 'Continuous Integration' are ONE skill.\n"
            "    Pick the more specific name and discard the synonym.\n"
            "  • Drop skills the student already has at intermediate+ in unified_skills\n"
            "    (these aren't real gaps).\n"
            "  • Cap at 5 entries. If more than 5 gaps remain, keep the 5 most critical\n"
            "    based on Step 3 priority rules — students can only realistically tackle\n"
            "    a few gaps at once.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 2 — GATHER EVIDENCE PER GAP\n"
            "═══════════════════════════════════════════════════════\n"
            "For each gap skill in your final list:\n\n"
            "  (a) Call rag_career_knowledge with query='[skill] learning resources for "
            "BSU CpE' and category='resources' (then 'gap_closer' if no hits).\n"
            "      Save any concrete project descriptions or curricula found.\n\n"
            "  (b) Call github_search with skill_name='[skill]' to find the top 2\n"
            "      most-starred learning repositories.\n"
            "      • If github_search returns NO results: omit the github_repo from\n"
            "        resources. DO NOT invent URLs or repo names.\n"
            "      • If results exist: use the title, url, stars, description verbatim\n"
            "        from the tool output. Never fabricate stargazer counts.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 3 — PRIORITY CALIBRATION\n"
            "═══════════════════════════════════════════════════════\n"
            "Assign priority using THESE rules — do not guess:\n\n"
            "  high:\n"
            "    • The skill is in the chunk's 'Required skills' list AND appears in\n"
            "      'Demonstrative GitHub projects' (i.e., it's both spec'd and visible\n"
            "      in real-world work).\n"
            "    • OR the student is missing a foundational skill (e.g., Git, Linux,\n"
            "      a primary language) for the career.\n\n"
            "  medium:\n"
            "    • The skill is in 'Required skills' but secondary to the career's\n"
            "      core stack (e.g., Redis for Backend Developer — useful but not\n"
            "      blocking).\n"
            "    • OR the student already has a beginner-level signal and just needs\n"
            "      to deepen.\n\n"
            "  low:\n"
            "    • Nice-to-have skills mentioned only in 'Learning order' as later\n"
            "      stages, or specialty tools.\n\n"
            "  Never assign 'high' to more than 3 of the 5 gaps — students need a\n"
            "  manageable focus list, not 5 emergencies.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 4 — ESTIMATE WEEKS (calibrated to current proficiency)\n"
            "═══════════════════════════════════════════════════════\n"
            "Base time by complexity:\n"
            "    Simple tool / utility (e.g., Docker, Git advanced features)  →  3 weeks\n"
            "    Framework (e.g., FastAPI, React, scikit-learn)               →  6 weeks\n"
            "    Paradigm (e.g., distributed systems, MLOps, RTOS)            →  10 weeks\n\n"
            "Adjust by current proficiency:\n"
            "    No prior signal at all                  →  base × 1.0 (full estimate)\n"
            "    Beginner / partial signal in unified_skills →  base × 0.6 (already started)\n"
            "    Adjacent skill (e.g., knows Express, gap is FastAPI) →  base × 0.5\n\n"
            "Round to nearest integer week. Floor at 2, cap at 12.\n"
            "estimated_total_weeks = sum of weeks across all gaps.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 5 — REASON FIELD QUALITY\n"
            "═══════════════════════════════════════════════════════\n"
            "Every gap's 'reason' must:\n"
            "  • Name the specific career this gap blocks (use recommended_career).\n"
            "  • Cite WHY the skill matters in that role (not generic praise).\n"
            "  • Be 1–2 sentences max. No filler.\n\n"
            "  Bad:  'Important skill for backend developers.'\n"
            "  Bad:  'Required for 90% of job postings.'  (unverifiable)\n"
            "  Good: 'Backend Developer roles use Docker to package services for "
            "deployment; without it, you can run apps locally but cannot ship them.'\n"
            "  Good: 'CI/CD is how teams catch regressions before they hit production; "
            "it is in every senior backend posting in PH 2024-2025.'\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 6 — OUTPUT RULES\n"
            "═══════════════════════════════════════════════════════\n"
            "  • Every entry in 'resources' MUST have a real URL from github_search\n"
            "    output, OR no resources at all (empty list is acceptable).\n"
            "  • If the recommended_career has 0 gap_skills, return:\n"
            "      gap_analysis: [], total_gaps: 0, estimated_total_weeks: 0\n"
            "  • Sort gap_analysis with high-priority entries first, then medium, then low.\n\n"

            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "gap_analysis": [\n'
            "    {\n"
            '      "skill": "Docker",\n'
            '      "priority": "high",\n'
            '      "reason": "Backend Developer roles use Docker to package and deploy services; without it, you can run apps locally but cannot ship to production.",\n'
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
            "A JSON object with keys: gap_analysis (list of up to 5 gaps, sorted "
            "high→low priority, each with at least one real GitHub URL from "
            "github_search OR an empty resources list — never invented URLs), "
            "total_gaps (int), estimated_total_weeks (int). Return ONLY the JSON."
        ),
        agent=agent,
        context=[career_task],
    )
