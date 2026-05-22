"""
report_agent.py — Agent 6: Career Report Generator.

Synthesizes all previous agent outputs into the final CareerReport JSON
that matches the schema the frontend already expects.
"""
from crewai import Agent, LLM
from crewai import Task

from app.core.config import GEMINI_MODEL


def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        max_retries=2,
        timeout=300,
        temperature=0.2,
        thinking={"type": "enabled", "budget_tokens": 1024},
    )


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
        llm=_get_llm(),
        tools=[],
        verbose=True,
        allow_delegation=False,
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
            "  - career_matches (Agent 4 — Career Mapper)\n"
            "  - gap_analysis (Agent 5 — Gap Analyst)\n\n"
            "Your job is to assemble the final CareerReport JSON. You are a synthesizer,\n"
            "NOT a re-interpreter — most fields must be copied verbatim from upstream\n"
            "agents. The only fields you generate are 'recommendations' and 'summary'.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 1 — VERBATIM COPY (do not paraphrase or invent)\n"
            "═══════════════════════════════════════════════════════\n"
            "  • career_matches: copy Agent 4's career_matches list AS-IS. Do not edit\n"
            "    titles, scores, matched_skills, gap_skills, reasoning, or roadmap_url.\n"
            "    Do not add careers Agent 4 did not return.\n"
            "  • skill_profile: copy Agent 3's unified_skills, skill_summary,\n"
            "    strongest_skills, weakest_skills AS-IS.\n"
            "  • gap_analysis: copy Agent 5's gap_analysis list AS-IS. Do not invent\n"
            "    new gaps, edit priorities, or change resource URLs.\n\n"
            "  Anti-hallucination rule: every skill, career, and resource that appears\n"
            "  anywhere in this report must already exist in an upstream agent's output.\n"
            "  If you cannot find it upstream, do not include it.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 2 — RECOMMENDATIONS (derive 1:1 from gap_analysis)\n"
            "═══════════════════════════════════════════════════════\n"
            "Generate 3–5 recommendation strings. Each MUST be tied to a specific entry\n"
            "in Agent 5's gap_analysis — no general advice, no skills not in gap_analysis.\n\n"
            "Format per recommendation: an action verb + the gap skill + a concrete next\n"
            "step + the estimated time from gap_analysis + the specific BSU CpE subject(s)\n"
            "from the curriculum (e.g., 'CpE 418 Software Design' or 'Operating Systems')\n"
            "that can help the student review or learn this skill (cross-reference with academic_skills\n"
            "or the BSU CpE subject mappings in the career path information).\n\n"
            "  Bad:  'Improve your DevOps skills.'                 (vague)\n"
            "  Bad:  'Take an online course in cloud computing.'   (skill not in gaps)\n"
            "  Good: 'Complete the docker/getting-started tutorial (related subject: CpE 418 Software Design or Operating Systems) — focuses on the\n"
            "         Docker gap — estimated 3 weeks.'\n"
            "  Good: 'Build a CI/CD pipeline with GitHub Actions on one of your existing\n"
            "         repos (related subject: CpE 418 Software Design or Emerging Technologies in CpE) — closes the CI/CD gap — estimated 2 weeks.'\n\n"
            "Order recommendations by gap_analysis priority: high entries first, then\n"
            "medium, then low. If gap_analysis has fewer than 3 entries, return that\n"
            "many recommendations only — DO NOT pad.\n"
            "If gap_analysis is empty, return an empty recommendations list.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 3 — SUMMARY (2–3 paragraphs, structured)\n"
            "═══════════════════════════════════════════════════════\n"
            "Write a 2–3 paragraph career readiness summary in plain English.\n"
            "Each paragraph MUST contain specific information drawn from upstream agents:\n\n"
            "  Paragraph 1 — Student profile snapshot (3–4 sentences):\n"
            "    • Address the student by their context name if available.\n"
            "    • Name 2 specific strongest_skills with proficiency levels\n"
            "      (e.g., 'advanced Python', 'intermediate React').\n"
            "    • Mention notable evidence: GitHub activity (e.g., commit count or\n"
            "      a pinned project) AND academic standout if present.\n\n"
            "  Paragraph 2 — Career recommendation + match reasoning (3–4 sentences):\n"
            "    • Name recommended_career and its match_score.\n"
            "    • Briefly explain WHY using 2 of its matched_skills.\n"
            "    • Note 1–2 alternative careers from career_matches[1:] for context.\n\n"
            "  Paragraph 3 — Action plan (2–3 sentences):\n"
            "    • Name the top 2 gap_analysis skills and the total estimated_total_weeks.\n"
            "    • Suggest which specific BSU CpE subject(s) (drawn from the recommended career path's 'BSU CpE subjects most relevant' list) can help the student strengthen their foundation for this path.\n"
            "    • End with one sentence of grounded encouragement — NOT generic\n"
            "      ('you can do it!'), but tied to the student's actual progress\n"
            "      ('your foundation in Python and a working REST API repo means the\n"
            "      Docker step is well within reach within 3 weeks').\n\n"
            "Tone rules:\n"
            "  • No bullet points. Flowing prose only.\n"
            "  • No jargon students would not recognize.\n"
            "  • No generic praise. Every claim must be evidence-backed.\n"
            "  • Honest about gaps but framed as next steps, not failures.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "OUTPUT (return ONLY this JSON, no prefix or suffix text)\n"
            "═══════════════════════════════════════════════════════\n"
            "{\n"
            '  "career_matches": [...],          // verbatim from Agent 4\n'
            '  "recommendations": [\n'
            '    "Complete docker/getting-started (related subject: CpE 418 Software Design or Operating Systems) — closes the Docker gap — estimated 3 weeks.",\n'
            '    "Build a CI/CD pipeline with GitHub Actions on an existing repo (related subject: CpE 418 Software Design or Emerging Technologies in CpE) — closes the CI/CD gap — estimated 2 weeks."\n'
            "  ],\n"
            '  "summary": "Three-paragraph plain-English career readiness summary citing specific skills, scores, gaps, and BSU CpE subjects.",\n'
            '  "skill_profile": {                 // verbatim from Agent 3\n'
            '    "unified_skills": [...],\n'
            '    "skill_summary": {...},\n'
            '    "strongest_skills": [...],\n'
            '    "weakest_skills": [...]\n'
            "  },\n"
            '  "gap_analysis": [...]             // verbatim from Agent 5\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: career_matches (verbatim from Agent 4), "
            "recommendations (3-5 strings, each tied 1:1 to a gap_analysis entry, "
            "or empty list if no gaps), summary (2-3 structured paragraphs citing "
            "specific evidence), skill_profile (verbatim from Agent 3), gap_analysis "
            "(verbatim from Agent 5). Return ONLY the JSON."
        ),
        agent=agent,
        context=[github_task, academic_task, skill_task, career_task, gap_task],
    )
