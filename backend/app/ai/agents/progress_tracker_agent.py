"""
progress_tracker_agent.py — Longitudinal Progress Tracker.

Compares current pipeline results with previous report data to calculate growth.
"""
from crewai import Agent, Task, LLM
from app.core.config import GEMINI_MODEL

def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        max_retries=2,
        timeout=300,
        temperature=0,
        thinking={"type": "enabled", "budget_tokens": 1024},
    )

def create_progress_tracker() -> Agent:
    return Agent(
        role="Longitudinal Progress Tracker",
        goal="Compare the current pipeline results with the student's previous CareerReport to calculate growth and changes",
        backstory=(
            "You are a career development analyst who specializes in tracking student "
            "progress over time at BSU CpE. You identify what has improved, what has "
            "regressed, and what new gaps have emerged since the last assessment."
        ),
        llm=_get_llm(),
        verbose=True,
        allow_delegation=False
    )

def create_progress_tracking_task(agent: Agent, current_report_task) -> Task:
    return Task(
        description=(
            "You have received the current report results and the student's previous "
            "report (previous_report_json) as context. Your job is to compute a "
            "deterministic diff between the two.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 1 — FIRST-RUN GUARD\n"
            "═══════════════════════════════════════════════════════\n"
            "If previous_report_json is null, the string 'null', or an empty object,\n"
            "this is the student's baseline run. Return EXACTLY:\n"
            "{\n"
            '  "readiness_score_change": 0,\n'
            '  "new_skills_gained": [],\n'
            '  "gaps_closed": [],\n'
            '  "new_gaps": [],\n'
            '  "trend": "baseline",\n'
            '  "summary": "This is the student\'s first career readiness assessment."\n'
            "}\n"
            "Do not invent a previous score. Stop here.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 2 — READINESS SCORE CHANGE\n"
            "═══════════════════════════════════════════════════════\n"
            "Define readiness_score for any report as the match_score of that report's\n"
            "RECOMMENDED career — i.e., look up career_matches where title equals\n"
            "recommended_career and use that entry's match_score.\n\n"
            "  current_score  = current report's recommended career match_score\n"
            "  previous_score = previous report's recommended career match_score\n"
            "  readiness_score_change = round(current_score - previous_score, 1)\n\n"
            "If either side is missing the recommended career or the entry, fall back\n"
            "to career_matches[0].match_score on that side. If still missing on either\n"
            "side, set readiness_score_change to 0.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 3 — SKILL & GAP COMPARISONS (case-insensitive)\n"
            "═══════════════════════════════════════════════════════\n"
            "All comparisons are case-insensitive on skill names. Treat known aliases\n"
            "as the same skill (e.g., 'Postgres' ≡ 'PostgreSQL', 'JS' ≡ 'JavaScript',\n"
            "'OOP' ≡ 'Object-Oriented Programming', 'k8s' ≡ 'Kubernetes').\n\n"
            "  Build these sets by name:\n"
            "    current_skills_set  = names from current report's skill_profile.unified_skills\n"
            "    previous_skills_set = names from previous report's skill_profile.unified_skills\n"
            "    current_gaps_set    = gap.skill names from current report's gap_analysis\n"
            "    previous_gaps_set   = gap.skill names from previous report's gap_analysis\n\n"
            "  Then:\n"
            "    new_skills_gained = sorted(current_skills_set − previous_skills_set)\n"
            "    gaps_closed       = sorted(previous_gaps_set − current_gaps_set)\n"
            "    new_gaps          = sorted(current_gaps_set − previous_gaps_set)\n\n"
            "Cap each list at 10 entries (most relevant first if more exist).\n"
            "Use the canonical name from the CURRENT report when emitting the result\n"
            "(so 'PostgreSQL' wins over 'Postgres' in the output).\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 4 — TREND CLASSIFICATION (numeric thresholds)\n"
            "═══════════════════════════════════════════════════════\n"
            "Apply these EXACT thresholds — do not soften:\n"
            "    readiness_score_change >= +5      →  trend = \"improving\"\n"
            "    readiness_score_change <  -5      →  trend = \"declining\"\n"
            "    -5 <= readiness_score_change < +5 →  trend = \"stable\"\n\n"
            "Special override: if readiness_score_change is between -5 and +5 BUT\n"
            "    len(gaps_closed) >= 2 AND len(new_gaps) == 0\n"
            "then trend = \"improving\" (the student is closing gaps even if the\n"
            "match_score didn't move much).\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 5 — SUMMARY (one sentence, evidence-backed)\n"
            "═══════════════════════════════════════════════════════\n"
            "Write ONE sentence that cites at least one specific change:\n"
            "  • If trend = \"improving\": name the biggest gap_closed or +Δscore.\n"
            "  • If trend = \"declining\": name the biggest new_gap or -Δscore.\n"
            "  • If trend = \"stable\": name what stayed the same and one minor change.\n\n"
            "  Bad:  'Some progress was made.'   (generic)\n"
            "  Good: 'Readiness up 7 points; closed the Docker gap and gained "
            "intermediate FastAPI proficiency.'\n"
            "  Good: 'Readiness flat at 78; no new gaps appeared but Kubernetes "
            "is still an open gap.'\n\n"

            "═══════════════════════════════════════════════════════\n"
            "OUTPUT (return ONLY this JSON, no explanation)\n"
            "═══════════════════════════════════════════════════════\n"
            "{\n"
            '  "readiness_score_change": 5.2,\n'
            '  "new_skills_gained": ["Docker", "REST APIs"],\n'
            '  "gaps_closed": ["Python Basics"],\n'
            '  "new_gaps": ["Kubernetes"],\n'
            '  "trend": "improving",\n'
            '  "summary": "Readiness up 5 points; closed the Python Basics gap and gained Docker — Kubernetes is the new focus area."\n'
            "}"
        ),
        expected_output=(
            "A single JSON object with: readiness_score_change (float, 1 decimal), "
            "new_skills_gained (list, ≤10, sorted), gaps_closed (list, ≤10, sorted), "
            "new_gaps (list, ≤10, sorted), trend (one of: improving/stable/declining/"
            "baseline), summary (one sentence citing at least one specific change). "
            "Return ONLY valid JSON."
        ),
        agent=agent,
        context=[current_report_task]
    )
