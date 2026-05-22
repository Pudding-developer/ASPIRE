"""
skill_agent.py — Agent 3: Skill Profile Synthesizer.

Merges GitHub skills (Agent 1) and academic skills (Agent 2) into
a single unified profile using a uniform weighted scoring rule:
  All domains:  Academic 60% / GitHub 40%

Exception: hardware/embedded skills whose name doesn't surface in any
analyzed GitHub repository fall back to 100% academic — there's no
practical signal to weight against, and applying GitHub=40 with score=0
would unfairly punish the skill.
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


def create_skill_synthesizer() -> Agent:
    return Agent(
        role="Skill Profile Synthesizer",
        goal=(
            "Combine GitHub technical skills and academic performance data "
            "into a single unified student skill profile with weighted confidence scores."
        ),
        backstory=(
            "You are a senior technical recruiter who evaluates both "
            "academic credentials and real-world coding portfolios. "
            "You apply a uniform weighting when scoring skills: "
            "academic performance carries 60% weight and GitHub work carries 40%. "
            "For hardware, embedded, circuit, signal processing, and microprocessor skills "
            "that have NO presence in any analyzed GitHub repository, you fall back to "
            "100% academic weight — there is no GitHub signal to fairly weigh against, "
            "and hardware engineering work is rarely reflected in public repositories. "
            "You reconcile conflicts between the two sources and always report both honestly."
        ),
        llm=_get_llm(),
        tools=[],
        verbose=True,
        allow_delegation=False,
    )


def create_skill_synthesis_task(
    agent: Agent,
    github_task,
    academic_task,
) -> Task:
    return Task(
        description=(
            "You have received the output of the GitHub Analyst (github_skills) "
            "and the Academic Analyst (academic_skills) as context.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 1 — INPUT FILTER (drop low-confidence GitHub skills)\n"
            "═══════════════════════════════════════════════════════\n"
            "Discard any github_skills entry with confidence < 0.5 before merging —\n"
            "the GitHub Analyst was instructed to drop these but enforce again here.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 2 — UNIFIED WEIGHTING WITH HARDWARE FALLBACK\n"
            "═══════════════════════════════════════════════════════\n"
            "Default rule for every skill: Academic 60% weight, GitHub 40% weight.\n\n"
            "  HARDWARE/EMBEDDED FALLBACK — if a skill matches any of these\n"
            "  keywords (case-insensitive) AND has NO entry in github_skills\n"
            "  (i.e., no analyzed repository demonstrated it), use Academic 100%,\n"
            "  GitHub 0% instead of the default 60/40:\n"
            "    Hardware, Embedded, Circuit, Signal, Microprocessor, VLSI, FPGA,\n"
            "    IoT, HDL, Verilog, VHDL, SystemVerilog, Firmware, PCB, RTOS,\n"
            "    Microcontroller, STM32, ESP32, ARM, RISC-V, ASIC, Sensor, Analog,\n"
            "    Digital Logic, CMOS, Oscilloscope.\n"
            "  If the hardware skill DOES appear in github_skills (e.g., student\n"
            "  has an Arduino or Verilog repo), apply the default 60/40 rule.\n\n"
            "  All other skills (software, web, cloud, data, networking, ML, etc.)\n"
            "    → always Academic 60% / GitHub 40%.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 3 — SKILL MATCHING (when do two entries merge into one?)\n"
            "═══════════════════════════════════════════════════════\n"
            "Two entries refer to the SAME skill if any of these hold:\n"
            "  • Skill names are identical (case-insensitive).\n"
            "  • One name is a well-known alias of the other (e.g., 'JavaScript' ≡ 'JS',\n"
            "    'Postgres' ≡ 'PostgreSQL', 'k8s' ≡ 'Kubernetes').\n"
            "  • The skills are obviously the same technology in different naming\n"
            "    conventions (e.g., 'Object-Oriented Programming' ≡ 'OOP').\n\n"
            "Two entries are DIFFERENT skills if:\n"
            "  • One is a language and the other is a framework on top of it\n"
            "    (e.g., 'Python' vs 'FastAPI' → keep separate, do NOT merge).\n"
            "  • One is a category and the other is a specific tech\n"
            "    (e.g., 'Programming & Software Development' vs 'Python' → keep separate).\n"
            "  • Names refer to different specializations\n"
            "    (e.g., 'Embedded C' vs 'C++' → keep separate).\n\n"
            "When in doubt, keep skills separate. Over-merging loses information.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 4 — COMPUTE FINAL SCORE PER SKILL\n"
            "═══════════════════════════════════════════════════════\n"
            "  • Convert GitHub proficiency to numeric: beginner=50, intermediate=75, advanced=90.\n"
            "  • Academic score = the source subject's avg_score.\n"
            "  • If skill is in BOTH sources after Step 3 matching:\n"
            "      final_score = round(academic_weight × academic_score +\n"
            "                          github_weight   × github_score)\n"
            "      source = \"both\"\n"
            "  • If skill is ONLY in github_skills:\n"
            "      final_score = github_score (rounded)\n"
            "      source = \"github\"\n"
            "      fusion_weights = {\"academic\": 0.0, \"github\": 1.0}\n"
            "  • If skill is ONLY in academic_skills:\n"
            "      final_score = academic_score (rounded)\n"
            "      source = \"academic\"\n"
            "      fusion_weights = {\"academic\": 1.0, \"github\": 0.0}\n\n"
            "Anti-hallucination: every emitted skill MUST have come from at least one\n"
            "source. Do not invent skills the student did not demonstrate.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 5 — CATEGORY ASSIGNMENT (single canonical source)\n"
            "═══════════════════════════════════════════════════════\n"
            "Each unified skill needs exactly one 'category' string.\n"
            "  • If only in github_skills: use the github_skills.category verbatim.\n"
            "  • If only in academic_skills: use the FIRST entry of skillset_categories.\n"
            "  • If in both: prefer the academic_skills skillset_categories[0]\n"
            "    (BSCpE-aligned naming); fall back to github_skills.category if missing.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 6 — STATUS, SUMMARY, TOP/BOTTOM\n"
            "═══════════════════════════════════════════════════════\n"
            "Apply status thresholds to final_score:\n"
            "    EXCEEDING EXPECTATIONS >= 80\n"
            "    ON TRACK               >= 60\n"
            "    NEEDS ATTENTION        >= 40\n"
            "    CRITICAL               <  40\n\n"
            "  • skill_summary counts: total_skills, exceeding, on_track,\n"
            "    needs_attention, critical.\n"
            "  • strongest_skills = top 3 skill names by final_score (descending).\n"
            "    Tie-break: prefer source='both', then 'github', then 'academic'.\n"
            "  • weakest_skills = bottom 3 skill names by final_score (ascending).\n"
            "    Same tie-break rule, but ascending source preference.\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "fusion_weights": {"academic": 0.6, "github": 0.4},\n'
            '  "unified_skills": [\n'
            "    {\n"
            '      "skill": "Python",\n'
            '      "category": "Programming Languages",\n'
            '      "final_score": 84.5,\n'
            '      "github_score": 75,\n'
            '      "academic_score": 91,\n'
            '      "status": "EXCEEDING EXPECTATIONS",\n'
            '      "source": "both",\n'
            '      "fusion_weights": {"academic": 0.6, "github": 0.4}\n'
            "    },\n"
            "    {\n"
            '      "skill": "Embedded C",\n'
            '      "category": "Embedded & Microprocessor Systems",\n'
            '      "final_score": 72.8,\n'
            '      "github_score": 50,\n'
            '      "academic_score": 88,\n'
            '      "status": "ON TRACK",\n'
            '      "source": "both",\n'
            '      "fusion_weights": {"academic": 0.6, "github": 0.4}\n'
            "    },\n"
            "    {\n"
            '      "skill": "Digital Signal Processing",\n'
            '      "category": "Signal Processing & Control Systems",\n'
            '      "final_score": 85.0,\n'
            '      "github_score": null,\n'
            '      "academic_score": 85,\n'
            '      "status": "EXCEEDING EXPECTATIONS",\n'
            '      "source": "academic",\n'
            '      "fusion_weights": {"academic": 1.0, "github": 0.0}\n'
            "    }\n"
            "  ],\n"
            '  "skill_summary": {\n'
            '    "total_skills": 12,\n'
            '    "exceeding": 4,\n'
            '    "on_track": 5,\n'
            '    "needs_attention": 2,\n'
            '    "critical": 1\n'
            '  },\n'
            '  "strongest_skills": ["Python", "FastAPI", "Algorithm Design"],\n'
            '  "weakest_skills": ["Networking", "Embedded Systems", "DevOps"],\n'
            '  "note": null\n'
            "}\n\n"
            "If academic_skills is empty or performance_tier is \"No Data\",\n"
            "synthesize skills from GitHub data only. Set source=\"github_only\", "
            "apply 100% GitHub weight, and set fusion_weights to {\"academic\": 0.0, \"github\": 1.0}.\n\n"
            "If github_skills is empty or missing, synthesize skills from academic data only. "
            "Set source=\"academic_only\", apply 100% academic weight, and set "
            "fusion_weights to {\"academic\": 1.0, \"github\": 0.0}. Add a note explaining this.\n\n"
            "Still produce a complete valid JSON output."
        ),
        expected_output=(
            "A JSON object with keys: fusion_weights (object), unified_skills (list), "
            "skill_summary (object), strongest_skills (list), weakest_skills (list). "
            "Return ONLY the JSON."
        ),
        agent=agent,
        context=[github_task, academic_task],
    )
