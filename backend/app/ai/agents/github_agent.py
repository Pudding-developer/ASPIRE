"""
github_agent.py — Agent 1: GitHub Repository Analyst.

Analyzes a student's cached GitHub repositories and contribution data
to extract concrete, evidence-backed technical skills.
"""
from crewai import Agent, LLM
from crewai import Task

from app.core.config import GEMINI_MODEL


def _get_llm() -> LLM:
    return LLM(
        model=GEMINI_MODEL,
        max_retries=2,
        timeout=300
    )


def create_github_analyzer(student_data_tool) -> Agent:
    return Agent(
        role="GitHub Repository Analyst",
        goal=(
            "Analyze a BSU Computer Engineering student's GitHub profile "
            "and extract concrete technical skills with evidence."
        ),
        backstory=(
            "You are an expert software engineer who specializes in "
            "reading GitHub portfolios. You analyze repository languages, dependencies, "
            "commit patterns, and contribution consistency to identify real technical "
            "skills — not generic labels. You distinguish between tutorial projects "
            "and original work. You never say 'the student knows Python' — you say "
            "'the student demonstrates intermediate Python proficiency based on async "
            "usage and OOP patterns across 4 repositories'."
        ),
        llm=_get_llm(),
        tools=[student_data_tool],
        verbose=True,
        allow_delegation=False,
    )


def create_github_analysis_task(agent: Agent) -> Task:
    return Task(
        description=(
            "Use the student_data_lookup tool with query='github' to fetch the student's "
            "full GitHub data, then extract evidence-backed technical skills.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 1 — WEIGH REPOSITORIES BEFORE EXTRACTING SKILLS\n"
            "═══════════════════════════════════════════════════════\n"
            "Not all repos are equal. Apply this weighting per repo:\n"
            "  • is_pinned == true             → weight ×3 (student's showcase work)\n"
            "  • stargazer_count > 0 OR fork_count > 0 → weight ×2 (peer-validated)\n"
            "  • commit_count >= 20            → weight ×2 (real iteration, not a one-off)\n"
            "  • commit_count < 5              → weight ×0.3 (likely abandoned / scaffold)\n"
            "  • Repo name matches /^(hello-world|todo-app|tutorial|exercise|lab\\d|hw\\d|assignment)/i\n"
            "    OR description references a course syllabus → weight ×0.2 (tutorial)\n"
            "  • Repo is a fork with no original commits → weight ×0 (skip entirely)\n\n"

            "Sum the weighted contribution per skill across repos. A skill that only appears\n"
            "in tutorial / abandoned repos is NOT a real skill.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 2 — DEPENDENCY → SKILL MAPPING (worked examples)\n"
            "═══════════════════════════════════════════════════════\n"
            "Read each repo's `dependencies` field (parsed from package.json /\n"
            "requirements.txt / pom.xml / pubspec.yaml) and apply mappings like these:\n\n"
            "  fastapi, uvicorn       → Python, FastAPI, REST API, async/await, ASGI\n"
            "  flask                  → Python, Flask, REST API\n"
            "  django                 → Python, Django, ORM, MVC patterns\n"
            "  sqlalchemy, alembic    → ORM, relational database design, migrations\n"
            "  psycopg2, asyncpg      → PostgreSQL\n"
            "  pydantic               → data validation, type-driven design\n"
            "  pytest, unittest       → automated testing, TDD\n"
            "  pandas, numpy          → data analysis, numerical computing\n"
            "  scikit-learn           → classical ML, model training, evaluation\n"
            "  torch, tensorflow      → deep learning, neural networks\n"
            "  langchain, llamaindex  → LLM apps, RAG, agent frameworks\n"
            "  pgvector, chromadb, pinecone → vector databases, semantic search\n"
            "  express, fastify       → JavaScript, Node.js, REST API\n"
            "  react, react-dom       → React, component architecture, JSX\n"
            "  next, gatsby           → React, SSR/SSG, full-stack framework\n"
            "  vue, nuxt              → Vue, reactive UI\n"
            "  tailwindcss, sass      → CSS, design systems, responsive design\n"
            "  redux, zustand, recoil → React state management\n"
            "  typescript             → TypeScript, type-safe JavaScript\n"
            "  prisma, drizzle, typeorm → ORM, schema modeling\n"
            "  jest, vitest, cypress  → JavaScript testing\n"
            "  docker, dockerfile     → Docker, containerization\n"
            "  kubernetes, helm       → Kubernetes, orchestration\n"
            "  github actions / workflows folder → CI/CD, automation\n"
            "  terraform, ansible     → Infrastructure as Code\n"
            "  aws-sdk, boto3, gcp/azure SDKs → cloud platforms\n"
            "  flutter, dart          → Flutter, mobile development\n"
            "  arduino, platformio    → Embedded C/C++, microcontrollers\n"
            "  freertos, zephyr       → RTOS, embedded systems\n"
            "  esp-idf                → ESP32, IoT\n"
            "  verilog, vhdl files    → HDL, digital design\n\n"

            "If you see a tech that's not in this list, infer the skill the same way —\n"
            "name the framework, the language it implies, and the practice it demonstrates.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 3 — PROFICIENCY CALIBRATION (do not guess)\n"
            "═══════════════════════════════════════════════════════\n"
            "Apply these strict rules — do NOT mark a skill 'advanced' on vibe alone:\n\n"
            "  beginner:\n"
            "    • Skill appears in 1 repo with < 20 commits, OR only in tutorial-tagged repos.\n"
            "    • Student uses the framework but only at hello-world / template level\n"
            "      (e.g., default scaffolding, no custom logic).\n\n"
            "  intermediate:\n"
            "    • Skill appears in 2+ original repos with 20+ commits each.\n"
            "    • Code shows non-trivial use: custom routes/handlers, multiple modules,\n"
            "      meaningful data structures, working integration with other tech.\n\n"
            "  advanced:\n"
            "    • Skill appears in 3+ original repos AND at least one shows depth:\n"
            "      production-style patterns (auth, error handling, tests, deployment),\n"
            "      OR optimization work (caching, query tuning, profiling),\n"
            "      OR a public/starred project that uses the skill heavily.\n"
            "    • Generic 'I used Python' is NEVER advanced — only specific skills are.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 4 — CONFIDENCE SCORING\n"
            "═══════════════════════════════════════════════════════\n"
            "Confidence ∈ [0.0, 1.0]:\n"
            "  • 0.9+: Multiple weighted-strong repos, clear evidence_detail you can name.\n"
            "  • 0.7–0.9: Strong signal in 1 pinned repo or 2+ medium repos.\n"
            "  • 0.5–0.7: Plausible but only 1 repo or only inferred from dependencies.\n"
            "  • < 0.5: DROP THE SKILL. Do not include it in output.\n\n"

            "═══════════════════════════════════════════════════════\n"
            "STEP 5 — OUTPUT RULES\n"
            "═══════════════════════════════════════════════════════\n"
            "• Every skill in github_skills MUST have a non-empty evidence_detail string\n"
            "  naming the specific patterns / files / behaviours observed.\n"
            "• Generic placeholders like 'used in code', 'general usage', or empty strings\n"
            "  are forbidden. If you cannot name specific evidence, drop the skill.\n"
            "• evidence (the list of repo names) must be repo names that actually exist\n"
            "  in the student data — do not invent repos.\n"
            "• If the student has 0 repos or 0 commits, return github_skills: [] with all\n"
            "  counts at 0. Do not hallucinate skills from nothing.\n\n"

            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "github_skills": [\n'
            "    {\n"
            '      "skill": "FastAPI",\n'
            '      "category": "Backend Development",\n'
            '      "proficiency": "intermediate",\n'
            '      "confidence": 0.85,\n'
            '      "evidence": ["aspire-backend", "thesis-api"],\n'
            '      "evidence_detail": "Uses async handlers, dependency injection, JWT auth across 2 repos with 100+ commits combined"\n'
            "    }\n"
            "  ],\n"
            '  "top_languages": ["Python", "JavaScript"],\n'
            '  "total_commits": 847,\n'
            '  "current_streak": 14,\n'
            '  "original_projects": 3,\n'
            '  "tutorial_projects": 2\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: github_skills (list of skills with confidence >= 0.5 "
            "and a non-empty evidence_detail), top_languages (list), total_commits (int), "
            "current_streak (int), original_projects (int), tutorial_projects (int). "
            "Return ONLY the JSON."
        ),
        agent=agent,
    )
