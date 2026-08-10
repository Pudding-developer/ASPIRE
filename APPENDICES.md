# ASPIRE Project Appendices 

This document serves as the technical appendix for the ASPIRE (Academic Student Performance and Intelligence for Retention and Enrollment) system codebase.

---

## Appendix A: Repository Directory & Module Layout

The following tree represents the complete layout of the ASPIRE application, highlighting the core responsibilities of each module:

```
ASPIRE/
├── backend/                           # FastAPI backend server
│   ├── app/                           # Main application package
│   │   ├── ai/                        # Agentic AI and RAG pipeline
│   │   │   ├── agents/                # CrewAI agent definitions (Academic/Career)
│   │   │   ├── tasks/                 # CrewAI task instructions
│   │   │   ├── crew.py                # Multi-agent coordination and execution
│   │   │   └── rag.py                 # Vector embedding and retrieval setup
│   │   ├── api/                       # API Route Controllers (FastAPI)
│   │   │   ├── admin_routes.py        # Admin panel CRUD, onboarding, and curriculum
│   │   │   ├── chat_routes.py         # Student chat sessions and advisor interaction
│   │   │   ├── curriculum_routes.py   # Versioned curriculum upload endpoints
│   │   │   ├── deps.py                # Authentication and session injection dependency
│   │   │   └── instructor_routes.py   # Class creation, grading, and advisee list
│   │   ├── core/                      # Application configs
│   │   │   ├── config.py              # Environment variables, CORS, and LLM auth
│   │   │   ├── database.py            # SQLite/PostgreSQL engine and session factory
│   │   │   └── security.py            # Password hashing (bcrypt) and JWT utility
│   │   ├── models/                    # SQLModel database schemas
│   │   │   ├── class_model.py         # Class and subject association models
│   │   │   ├── curriculum.py          # Versioned curricula and subjects models
│   │   │   ├── pipeline_models.py     # Background job tracking models
│   │   │   └── user.py                # User credentials, roles, and profiles
│   │   ├── repositories/              # Database querying layers
│   │   ├── schemas/                   # Pydantic schemas (request DTOs)
│   │   └── services/                  # Business logic services
│   │       ├── admin_service.py       # Administration management
│   │       ├── class_service.py       # Grade parsing, class registration
│   │       ├── pipeline_service.py    # Multi-agent workflow scheduler
│   │       └── roadmap_service.py     # Career roadmap synthesis
│   ├── Documents/                     # Curriculum spreadsheets & raw RAG source docs
│   ├── migrations/                    # Alembic SQL database migration versions
│   ├── ml/                            # Machine learning predictor pipeline
│   │   ├── artifacts/                 # Serialized model (.joblib) and metrics
│   │   ├── config/                    # Targets configuration (COURSE_PROFILES)
│   │   └── training/                  # Scikit-learn regressor training scripts
│   ├── scripts/                       # Database seeders (e.g., seed_admin.py)
│   ├── tests/                         # Pytest automated testing suite
│   ├── main.py                        # FastAPI entry point
│   └── requirements.txt               # Backend dependencies
│
└── frontend/                          # React + Vite frontend client
    ├── public/                        # Static assets (landing page video, logos)
    ├── src/                           # Frontend source code
    │   ├── assets/                    # Styled icons, layout assets, global css
    │   ├── context/                   # React authentication state wrappers
    │   ├── features/                  # Feature-specific components and custom hooks
    │   │   ├── admin/                 # Admin panel tabs (Curriculum, Advising)
    │   │   ├── instructor/            # Class creation, student advising profiles
    │   │   ├── landing/               # Hero sections and preview components
    │   │   └── student/               # Career coach, classes, GitHub metrics views
    │   ├── pages/                     # Top-level React router page components
    │   ├── services/                  # Backend API integrations
    │   └── main.jsx                   # React application root mount point
    ├── package.json                   # Node modules configurations
    └── vite.config.js                 # Vite build configurator
```

---

## Appendix B: Relational Database Schema

The backend uses **SQLModel** (combining Pydantic and SQLAlchemy) to handle async PostgreSQL connections. The core entity relationships are defined as follows:

### 1. `User` Entity
Stores user profiles, roles, authentication credentials, and advising metadata.
- **Attributes:**
  - `id`: `Integer` (Primary Key)
  - `email`: `String` (Unique, indexed)
  - `hashed_password`: `String`
  - `full_name`: `String`
  - `role`: `Enum` (`student`, `instructor`, `admin`)
  - `is_active`: `Boolean`
  - `chosen_career`: `String` (Optional, student-selected target career)
  - `advisor_id`: `Integer` (Self-referencing Foreign Key pointing to an Instructor)

### 2. `Class` Entity
Represents an active academic class led by an instructor.
- **Attributes:**
  - `id`: `Integer` (Primary Key)
  - `subject_name`: `String` (e.g., "Computer Programming 1")
  - `subject_code`: `String` (e.g., "CpE 401")
  - `semester`: `Integer` (1 or 2)
  - `academic_year`: `String` (e.g., "2025-2026")
  - `instructor_id`: `Integer` (Foreign Key pointing to `User.id`)
  - `curriculum_id`: `Integer` (Foreign Key pointing to `Curriculum.id`)

### 3. `Curriculum` & `CurriculumSubject` Entities
Supports uploading and running multiple curriculum versions concurrently.
- **`Curriculum` Attributes:**
  - `id`: `Integer` (Primary Key)
  - `name`: `String` (e.g., "BSCpE Curriculum 2024")
  - `uploaded_at`: `DateTime`
- **`CurriculumSubject` Attributes:**
  - `id`: `Integer` (Primary Key)
  - `curriculum_id`: `Integer` (Foreign Key pointing to `Curriculum.id`)
  - `subject_code`: `String`
  - `subject_name`: `String`
  - `semester`: `Integer`
  - `year_level`: `Integer`

### 4. `StudentScore` Entity
Stores granular grade records mapped to Intended Learning Outcomes (ILOs).
- **Attributes:**
  - `id`: `Integer` (Primary Key)
  - `student_id`: `Integer` (Foreign Key pointing to `User.id`)
  - `assessment_id`: `Integer` (Foreign Key pointing to the Assessment)
  - `ilo_id`: `Integer` (Foreign Key pointing to `AssessmentILO.id`)
  - `score`: `Float`

### 5. `PipelineJob` Entity
Tracks long-running background tasks, such as generating career advising roadmaps.
- **Attributes:**
  - `id`: `Integer` (Primary Key)
  - `student_id`: `Integer` (Foreign Key pointing to `User.id`)
  - `status`: `String` (`pending`, `running`, `completed`, `failed`, `canceled`)
  - `started_at`: `DateTime`
  - `completed_at`: `DateTime`
  - `error`: `String`

---

## Appendix C: System Architecture & Data Flow

ASPIRE is designed as a decoupled client-server architecture. The following diagram illustrates the flow of student data through the performance prediction, retrieval-augmented career matching, and multi-agent report generation phases:

```
                  ┌───────────────────────────────┐
                  │       Frontend Client         │
                  │  (React 19 / Vite / Axios)    │
                  └───────────────┬───────────────┘
                                  │ HTTP Requests
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend                           │
│                                                                 │
│  ┌──────────────────────┐             ┌──────────────────────┐  │
│  │   API Route Layer    ├────────────►│   Service Layer      │  │
│  │  (app/api/curriculm) │             │ (app/services/class) │  │
│  └──────────────────────┘             └──────────┬───────────┘  │
│                                                  │              │
│                                                  ▼              │
│  ┌──────────────────────┐             ┌──────────────────────┐  │
│  │   Database Layer     │◄────────────┤  Agentic Advisor     │  │
│  │  (app/repositories)  │             │  (app/ai/crew.py)    │  │
│  └──────────┬───────────┘             └──────────┬───────────┘  │
└─────────────┼────────────────────────────────────┼──────────────┘
              │ SQL Query                          │ REST API
              ▼                                    ▼
┌───────────────────────────────┐       ┌─────────────────────────┐
│     PostgreSQL Database       │       │       Gemini LLM        │
│ (Users, Scores, Curricula)    │       │ (AI Studio / Vertex AI) │
└───────────────────────────────┘       └─────────────────────────┘
```

### Core Execution Pipeline
1. **Grading & Aggregation:** Instructors upload assessment grades. The system groups scores by student and Intended Learning Outcome (ILO) number (1 to 4) per course.
2. **Skillset Prediction:** The backend feeds the student's ILO score matrix into a pre-trained local Machine Learning model, outputting predicted scores for **20 master professional skills** (e.g., Programming, Embedded Systems, Ethics).
3. **Career Knowledge RAG:** When a student requests advising, the system embeds their target career and performs semantic searches against curriculum career guides stored in the vector database.
4. **Agentic Consultation:** CrewAI initializes:
   - **Academic Advisor Agent:** Analyzes academic performance and skillset gaps.
   - **Career Coach Agent:** Maps these gaps to industry requirements and designs a semester-by-semester study roadmap.
5. **Advising Report:** The agents synthesize the results into a Markdown report, which is saved as an artifact for student preview and download.

---

## Appendix D: Machine Learning Predictive Subsystem

ASPIRE features a local predicting model designed to evaluate student performance trends and translate them into a multi-dimensional skillset profile.

### 1. Model Structure
- **Algorithm:** Scikit-learn `MultiOutputRegressor` wrapping `GradientBoostingRegressor`.
- **Target Vector Size:** 20 dimensions (corresponds to the 20 master professional skills defined in ## Appendix F: Multi-Agent AI Advising Pipeline Core (`crew.py`)

This appendix provides the technical orchestration details for the RAG-enabled, CrewAI student advising and career coaching pipeline. It contains the system's core orchestration pseudocode, followed by the complete production Python implementation.

### 1. Pipeline Execution Pseudocode

The following pseudocode outlines the step-by-step logic executed by the pipeline orchestrator (`build_and_run_crew`), including the privacy boundary safeguards, performance caching bypasses, sequential agent execution, rate-limit recovery, and deterministic post-processing alignment:

```python
FUNCTION build_and_run_crew(student_data, previous_report, subject_skill_context, student_id, sync_db):
    INPUTS:
        student_data: Dictionary containing student demographics, grades, and GitHub data
        previous_report: JSON string of the last generated career report (optional)
        subject_skill_context: String defining mapped subjects and skill relations
        student_id: Integer user ID for cache lookup (optional)
        sync_db: Database session for cached results persistence (optional)
    
    OUTPUT:
        Dictionary containing the synthesized career matches, recommendations, and progression data

    // --- STEP 1: PRIVACY SAFEGUARD (INPUT BOUNDARY) ---
    safe_student_data = pseudonymize_student_data(student_data)
    // Hash Name, Email, SR-Code, and GitHub username to secure identifiers before LLM boundary

    // --- STEP 2: RETRY & SELF-HEALING LOOP ---
    max_attempts = 5
    FOR attempt FROM 1 TO max_attempts:
        INITIALIZE student_data_tool WITH safe_student_data
        INITIALIZE rag_career_tool
        INITIALIZE github_search_tool

        // --- STEP 3: CACHE LOOKUP FOR ANALYZER AGENTS ---
        use_cached_github = False
        use_cached_academic = False
        cached_github_skills = NULL
        cached_academic_skills = NULL

        IF student_id AND sync_db ARE PROVIDED:
            // Fetch cached GitHub extraction if repo data hash matches
            github_hash = hash_data(student_data["github"])
            cached_github_skills = get_cached_github_skills(student_id, github_hash, sync_db)
            IF cached_github_skills IS NOT NULL:
                use_cached_github = True

            // Fetch cached academic skillset extraction if grades hash matches
            academic_hash = hash_data(student_data["academic_scores"])
            cached_academic_skills = get_cached_academic_skills(student_id, academic_hash, sync_db)
            IF cached_academic_skills IS NOT NULL:
                use_cached_academic = True

        // --- STEP 4: INITIALIZE AGENTS AND TASKS ---
        CREATE agents:
            github_analyzer, academic_analyzer, skill_synthesizer,
            career_mapper, gap_analyst, report_generator, progress_tracker
            
        CREATE tasks:
            github_task, academic_task, skill_task,
            career_task, gap_task, report_task, progress_task

        // --- STEP 5: PRE-FILL CACHED TASK OUTPUTS ---
        IF use_cached_github:
            github_task.output = cached_github_skills
        IF use_cached_academic:
            academic_task.output = cached_academic_skills

        // Inject subject skill mappings into Academic Analyzer task prompt
        academic_task.description = replace(academic_task.description, "{subject_skill_context}", subject_skill_context)

        // --- STEP 6: FILTER ACTIVE PIPELINE PIPES ---
        active_agents = []
        active_tasks = []

        # If cache hits exist, skip executing those specific agents
        IF NOT use_cached_github:
            active_agents.append(github_analyzer)
            active_tasks.append(github_task)
        IF NOT use_cached_academic:
            active_agents.append(academic_analyzer)
            active_tasks.append(academic_task)

        ADD [skill_synthesizer, career_mapper, gap_analyst, report_generator, progress_tracker] TO active_agents
        ADD [skill_task, career_task, gap_task, report_task, progress_task] TO active_tasks

        // --- STEP 7: ASSEMBLE AND EXECUTE CREWAI ---
        crew = Assemble CrewAI(agents=active_agents, tasks=active_tasks, process=Sequential, max_rpm=30)
        
        TRY:
            crew.kickoff(inputs={
                "student_name": safe_student_data.full_name,
                "sr_code": safe_student_data.sr_code,
                "previous_report_json": previous_report,
                "subject_skill_context": subject_skill_context
            })
            break // Execution succeeded, break attempt loop
            
        EXCEPT Exception as error:
            // Intermediate cache save of completed components on partial failure
            IF NOT use_cached_github AND github_task completed:
                save_github_skills(student_id, github_hash, github_task.output, sync_db)
            IF NOT use_cached_academic AND academic_task completed:
                save_academic_skills(student_id, academic_hash, academic_task.output, sync_db)

            // Check for rate limits (HTTP 429)
            IF error IS RateLimit AND attempt < max_attempts:
                sleep(65 * attempt) // Exponential backoff wait
                continue            // Rebuild crew and retry
            ELSE:
                RAISE error         // Fail permanently for other errors or final attempt

    // --- STEP 8: PERSIST FRESHLY GENERATED EXTRACTIONS TO CACHE ---
    IF NOT use_cached_github AND execution succeeded:
        save_github_skills(student_id, github_hash, github_task.output, sync_db)
    IF NOT use_cached_academic AND execution succeeded:
        save_academic_skills(student_id, academic_hash, academic_task.output, sync_db)

    // --- STEP 9: PRIVACY SAFEGUARD (OUTPUT BOUNDARY) ---
    report_raw = redact_pii(report_task.output.raw, student_data)
    progress_raw = redact_pii(progress_task.output.raw, student_data)
    // Scrub any cleartext names, emails, or IDs that leaked back via LLM output

    // --- STEP 10: DETERMINISTIC POST-PROCESSING ALIGNMENT ---
    report_dict = parse_json(report_raw)
    progress_dict = parse_json(progress_raw)

    // Recompute unified skill scores in pure Python using domain weighting:
    // (60% Academic / 40% GitHub for software; 70% Academic / 30% GitHub for hardware)
    skill_profile = recompute_unified_skills(report_dict.skill_profile.unified_skills)
    report_dict.skill_profile = skill_profile

    // Deterministically score career match percentages using the unified skill profiles
    rescored_careers = recompute_career_matches(report_dict.career_matches, skill_profile.unified_skills)
    
    // Sync longitudinal progress indicators with the new deterministic math scores
    IF rescored_careers IS NOT EMPTY:
        progress_dict.career_readiness_score = rescored_careers[0].match_score
        progress_dict.readiness_change = progress_dict.career_readiness_score - previous_readiness_score

    RETURN fused_output(rescored_careers, report_dict.recommendations, report_dict.summary, skill_profile, report_dict.gap_analysis, progress_dict)
```

### 2. Complete Python Implementation (`crew.py`)

The following Python code represents the active production orchestrator of the RAG-enabled, CrewAI student advising and career coaching pipeline:

```python
"""
crew.py — Assembles and runs the 6-agent sequential CrewAI pipeline for student career mapping.

Pipeline order:
  1. GitHub Analyzer      — extracts skills from GitHub repos/contributions
  2. Academic Analyzer    — maps ILO scores to real-world skills
  3. Skill Synthesizer    — merges both sources with 40/60 weighting
  4. Career Mapper        — matches skill profile to career paths via RAG
  5. Gap Analyst          — finds learning resources for each skill gap
  6. Report Generator     — produces the final CareerReport JSON
"""
import json
import logging
import time

from crewai import Crew, Process
from litellm.exceptions import RateLimitError as LiteLLMRateLimitError
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from app.ai.tools.student_data_tool import StudentDataTool
from app.ai.tools.rag_career_tool import RAGCareerTool
from app.ai.tools.github_search_tool import GitHubSearchTool
from app.core.pseudonymizer import pseudonymize_student_data, redact_pii

from app.ai.agents.github_agent import create_github_analyzer, create_github_analysis_task
from app.ai.agents.academic_agent import create_academic_analyzer, create_academic_analysis_task
from app.ai.agents.skill_agent import create_skill_synthesizer, create_skill_synthesis_task
from app.ai.agents.career_agent import create_career_mapper, create_career_mapping_task
from app.ai.agents.gap_agent import create_gap_analyst, create_gap_analysis_task
from app.ai.agents.report_agent import create_report_generator, create_report_generation_task
from app.ai.agents.progress_tracker_agent import create_progress_tracker, create_progress_tracking_task

logger = logging.getLogger(__name__)




import re

def _parse_json(raw: str) -> dict:
    """Robust JSON parsing that strips markdown code blocks and surrounding text."""
    cleaned = raw.strip()
    
    # 1. Try splitting by ```json first (most specific to avoid other code blocks like python)
    if "```json" in cleaned:
        try:
            json_str = cleaned.split("```json", 1)[1].split("```", 1)[0]
            return json.loads(json_str.strip())
        except Exception:
            pass
            
    # 2. Try to find a JSON block enclosed in general markdown backticks
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass
    
    # 3. Fallback: find the first { and last }
    match_braces = re.search(r'(\{.*\})', cleaned, re.DOTALL)
    if match_braces:
        try:
            return json.loads(match_braces.group(1).strip())
        except Exception:
            pass
        
    return json.loads(cleaned)


def build_and_run_crew(
    student_data: dict,
    previous_report: str = None,
    subject_skill_context: str = "No subjects enrolled yet.",
    student_id: int | None = None,
    sync_db=None,
) -> dict:
    """
    Synchronous entry point — called via asyncio.to_thread() from pipeline_service.

    Builds the 7-agent crew, runs it sequentially, and returns the parsed
    CareerReport dict that matches the schema expected by the frontend.

    student_id + sync_db: when provided, Agent 1's output is cached in
    github_skill_cache. On cache hit the agent is skipped and the last
    stable extraction is reused — eliminating run-to-run score variance
    caused by LLM non-determinism on the same repo data.
    """
    max_attempts = 5
    github_task = None
    academic_task = None
    report_task = None
    progress_task = None

    # ── Self-healing cache-aware retry loop ─────────────────────────────────
    # ── Deep-copy and pseudonymize up front ─────────────────────────────────
    safe_student_data = pseudonymize_student_data(student_data)

    for attempt in range(1, max_attempts + 1):
        # ── Instantiate shared tools ──────────────────────────────────────────────
        student_data_tool = StudentDataTool()
        student_data_tool.set_data(safe_student_data)

        rag_career_tool = RAGCareerTool()
        github_search_tool = GitHubSearchTool()

        # ── GitHub Skill Cache check ───────────────────────────────────────────────
        _cached_github_output: str | None = None
        _github_data_hash: str | None = None
        _use_cached_github = False

        if student_id and sync_db is not None:
            try:
                from app.ai.cache.github_skill_cache import hash_github_data, get_cached_github_skills
                github_block = student_data.get("github", {})
                _github_data_hash = hash_github_data(github_block)
                cached = get_cached_github_skills(student_id, _github_data_hash, sync_db)
                if cached is not None:
                    _use_cached_github = True
                    _cached_github_output = json.dumps(cached)
                    logger.info("[crew] GitHub skill cache HIT — skipping Agent 1")
                else:
                    logger.info("[crew] GitHub skill cache MISS — running Agent 1")
            except Exception as exc:
                logger.warning("[crew] Cache check failed: %s — falling back to Agent 1", exc)

        # ── Academic Skill Cache check ────────────────────────────────────────────
        _cached_academic_output: str | None = None
        _academic_data_hash: str | None = None
        _use_cached_academic = False

        if student_id and sync_db is not None:
            try:
                from app.ai.cache.academic_skill_cache import hash_academic_data, get_cached_academic_skills
                academic_block = student_data.get("academic_scores", [])
                _academic_data_hash = hash_academic_data(academic_block)
                cached_academic = get_cached_academic_skills(student_id, _academic_data_hash, sync_db)
                if cached_academic is not None:
                    _use_cached_academic = True
                    _cached_academic_output = cached_academic
                    logger.info("[crew] Academic skill cache HIT — skipping Agent 2")
                else:
                    logger.info("[crew] Academic skill cache MISS — running Agent 2")
            except Exception as exc:
                logger.warning("[crew] Academic cache check failed: %s — falling back to Agent 2", exc)

        # ── Create agents ─────────────────────────────────────────────────────────
        github_analyzer   = create_github_analyzer(student_data_tool)
        academic_analyzer = create_academic_analyzer(student_data_tool)
        skill_synthesizer = create_skill_synthesizer()
        career_mapper     = create_career_mapper(rag_career_tool)
        gap_analyst       = create_gap_analyst(rag_career_tool, github_search_tool)
        report_generator  = create_report_generator()
        progress_tracker  = create_progress_tracker()

        # ── Create tasks (order matters — context chains forward) ─────────────────
        github_task   = create_github_analysis_task(github_analyzer)
        academic_task = create_academic_analysis_task(academic_analyzer)
        skill_task    = create_skill_synthesis_task(skill_synthesizer, github_task, academic_task)
        career_task   = create_career_mapping_task(career_mapper, skill_task)
        gap_task      = create_gap_analysis_task(gap_analyst, career_task)
        report_task   = create_report_generation_task(
            report_generator,
            github_task,
            academic_task,
            skill_task,
            career_task,
            gap_task,
        )
        progress_task = create_progress_tracking_task(progress_tracker, report_task)

        # ── If cache hit: pre-fill github_task output so Agent 1 is skipped ──────
        if _use_cached_github and _cached_github_output:
            github_task.output = type("TaskOutput", (), {"raw": _cached_github_output})()
            logger.info("[crew] Injected cached github_skills into github_task.output")

        # ── If academic cache hit: pre-fill academic_task output so Agent 2 is skipped
        if _use_cached_academic and _cached_academic_output:
            academic_task.output = type("TaskOutput", (), {"raw": _cached_academic_output})()
            logger.info("[crew] Injected cached academic_skills into academic_task.output")

        # ── Inject deterministic subject mappings into Agent 2 ───────────────
        academic_task.description = academic_task.description.replace(
            "{subject_skill_context}",
            subject_skill_context
        )

        # ── Assemble crew ─────────────────────────────────────────────────────────
        agents = []
        tasks = []
        
        if not _use_cached_github:
            agents.append(github_analyzer)
            tasks.append(github_task)
            
        if not _use_cached_academic:
            agents.append(academic_analyzer)
            tasks.append(academic_task)
            
        agents.extend([
            skill_synthesizer,
            career_mapper,
            gap_analyst,
            report_generator,
            progress_tracker,
        ])
        
        tasks.extend([
            skill_task,
            career_task,
            gap_task,
            report_task,
            progress_task,
        ])

        crew = Crew(
            agents=agents,
            tasks=tasks,
            process=Process.sequential,
            verbose=True,
            max_rpm=30,  # bumped from 15 — gemini-2.5-flash has no explicit RPM cap on this project
        )

        # ── Identifiers handed to the prompt template are already pseudonymized ─
        inputs = {
            "student_name": safe_student_data.get("full_name", "Student-unknown"),
            "sr_code":      safe_student_data.get("sr_code", "unknown"),
            "previous_report_json": previous_report or "null",
            "subject_skill_context": subject_skill_context,
        }

        try:
            crew.kickoff(inputs=inputs)
            break  # success! exit the retry loop
        except Exception as e:
            err_str = str(e)
            
            # --- INTERMEDIATE CACHE SAVE ON FAILURE ---
            # Save any completed tasks to DB cache so the next retry can skip them
            if not _use_cached_github and student_id and sync_db is not None and _github_data_hash:
                try:
                    from app.ai.cache.github_skill_cache import save_github_skills
                    raw_github = github_task.output.raw if (github_task.output and hasattr(github_task.output, 'raw')) else ""
                    if raw_github.strip():
                        try:
                            skills_dict = _parse_json(raw_github)
                            save_github_skills(student_id, _github_data_hash, skills_dict, sync_db)
                            logger.info("[crew] Intermediate cache save: saved GitHub skills on failure")
                        except Exception as parse_err:
                            logger.warning("[crew] Could not parse Agent 1 output for intermediate cache: %s", parse_err)
                except Exception as exc:
                    logger.warning("[crew] Intermediate GitHub cache save failed: %s", exc)

            if not _use_cached_academic and student_id and sync_db is not None and _academic_data_hash:
                try:
                    from app.ai.cache.academic_skill_cache import save_academic_skills
                    raw_academic = academic_task.output.raw if (academic_task.output and hasattr(academic_task.output, 'raw')) else ""
                    if raw_academic.strip():
                        save_academic_skills(student_id, _academic_data_hash, raw_academic, sync_db)
                        logger.info("[crew] Intermediate cache save: saved Academic skills on failure")
                except Exception as exc:
                    logger.warning("[crew] Intermediate Academic cache save failed: %s", exc)

            is_rate_limit = (
                "RESOURCE_EXHAUSTED" in err_str
                or "RateLimitError" in err_str
                or "429" in err_str
            )
            if is_rate_limit and attempt < max_attempts:
                wait_secs = 65 * attempt
                print(f"\n[crew] Rate-limit hit on attempt {attempt}/{max_attempts}. "
                      f"Waiting {wait_secs}s before rebuilding crew and retrying...\n")
                time.sleep(wait_secs)
                continue
            
            # Re-raise on non-rate-limit errors or final attempt exhaustion
            import traceback
            print(f"\n{'='*60}")
            print(f"CREW PIPELINE FAILED: {e}")
            traceback.print_exc()
            print(f"{'='*60}\n")
            return {
                "error": f"AI Pipeline execution failed: {str(e)}",
                "note": "The crew failed to complete the analysis tasks."
            }

    # ── Save fresh Agent 1 output to cache (only on successful completion) ───────────────
    if not _use_cached_github and student_id and sync_db is not None and _github_data_hash:
        try:
            from app.ai.cache.github_skill_cache import save_github_skills
            raw_github = github_task.output.raw if (github_task.output and hasattr(github_task.output, 'raw')) else ""
            if raw_github.strip():
                try:
                    skills_dict = _parse_json(raw_github)
                    save_github_skills(student_id, _github_data_hash, skills_dict, sync_db)
                except (json.JSONDecodeError, Exception) as parse_err:
                    logger.warning("[crew] Could not parse Agent 1 output for cache: %s", parse_err)
                    with open('/tmp/err.log', 'a') as f:
                        f.write(f"Parse error: {parse_err}\nRaw output was: {raw_github}\n")
        except Exception as exc:
            logger.warning("[crew] Cache save failed: %s — continuing without cache", exc)

    # ── Save fresh Agent 2 output to cache (only on academic cache miss) ───────
    if not _use_cached_academic and student_id and sync_db is not None and _academic_data_hash:
        try:
            from app.ai.cache.academic_skill_cache import save_academic_skills
            raw_academic = academic_task.output.raw if (academic_task.output and hasattr(academic_task.output, 'raw')) else ""
            if raw_academic.strip():
                save_academic_skills(student_id, _academic_data_hash, raw_academic, sync_db)
        except Exception as exc:
            logger.warning("[crew] Academic cache save failed: %s — continuing without cache", exc)

    # Extract raw outputs from the tasks directly
    report_raw = report_task.output.raw if report_task.output else ""
    progress_raw = progress_task.output.raw if progress_task.output else ""

    # ── Output-side PII redaction ───────────────────────────────────────────
    report_raw = redact_pii(report_raw, student_data)
    progress_raw = redact_pii(progress_raw, student_data)

    try:
        return _parse_combined_output(report_raw, progress_raw)
    except ValueError as ve:
        return {
            "error": f"AI Pipeline parsing failed: {str(ve)}",
            "note": "The agents produced an invalid output format."
        }


def _parse_combined_output(report_raw: str, progress_raw: str) -> dict:
    """
    Parses and merges outputs from the Report Generator and Progress Tracker.

    Also overrides the LLM-computed match_scores with deterministic Python
    scores so the same student profile always produces the same numbers.
    """
    from app.ai.scoring import recompute_career_matches, recompute_unified_skills

    # Define required keys for validation
    report_keys = [
        "career_matches", "recommendations", "summary",
        "skill_profile", "gap_analysis"
    ]
    # We validate a minimal set for progress to allow for variations between agent versions
    progress_keys = ["readiness_score_change", "summary"]

    report_dict = _parse_json_snippet(report_raw, required_keys=report_keys)
    progress_dict = _parse_json_snippet(progress_raw, required_keys=progress_keys)

    skill_profile = report_dict.get("skill_profile", {}) or {}
    raw_unified = skill_profile.get("unified_skills", []) or []
    fused = recompute_unified_skills(raw_unified)
    skill_profile["unified_skills"] = fused["unified_skills"]
    skill_profile["skill_summary"] = fused["skill_summary"]
    skill_profile["strongest_skills"] = fused["strongest_skills"]
    skill_profile["weakest_skills"] = fused["weakest_skills"]
    report_dict["skill_profile"] = skill_profile

    # Deterministic re-scoring of Career Mapper output
    rescored = recompute_career_matches(
        report_dict.get("career_matches", []) or [],
        skill_profile["unified_skills"],
    )

    # Sync the progress block to the new top score so it's consistent.
    if rescored:
        progress_dict["career_readiness_score"] = rescored[0].get("match_score", 0)
        prev = progress_dict.get("previous_readiness_score", 0) or 0
        progress_dict["readiness_change"] = (
            progress_dict["career_readiness_score"] - prev if prev else 0
        )

    raw_recs = report_dict.get("recommendations", []) or []
    clean_recs = []
    for r in raw_recs:
        if isinstance(r, str):
            clean_recs.append(r)
        elif isinstance(r, dict):
            val = r.get("recommendation") or r.get("text") or r.get("desc") or str(r)
            clean_recs.append(val)
        else:
            clean_recs.append(str(r))

    return {
        "career_matches":  rescored,
        "recommendations": clean_recs,
        "summary":         report_dict.get("summary", ""),
        "skill_profile":   skill_profile,
        "gap_analysis":    report_dict.get("gap_analysis", []),
        "progress":        progress_dict,
    }


def _parse_json_snippet(raw: str, required_keys: list = None) -> dict:
    """
    Robustly extracts JSON from LLM output.
    """
    import re
    cleaned = raw.strip()
    
    # Try 1: Direct load (after stripping markdown code fences if present)
    json_str = cleaned
    if "```json" in json_str:
        json_str = json_str.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in json_str:
        json_str = json_str.split("```", 1)[1].split("```", 1)[0]
    
    try:
        data = json.loads(json_str.strip())
        if _validate_keys(data, required_keys):
            return data
    except Exception:
        pass
        
    # Try 2: Regex fallback (find everything from first '{' to last '}')
    match = re.search(r'(\{.*\})', cleaned, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(1).strip())
            if _validate_keys(data, required_keys):
                return data
        except Exception:
            pass
            
    # Everything failed
    msg = f"Failed to extract valid JSON with required keys {required_keys or []} from LLM output."
    raise ValueError(msg)


def _validate_keys(data: dict, required_keys: list) -> bool:
    """Checks if all required keys exist in the dictionary."""
    if not required_keys:
        return True
    if not isinstance(data, dict):
        return False
    return all(key in data for key in required_keys)


def _default_progression() -> dict:
    """Fallback progression dict used when JSON parsing fails or key is absent."""
    return {
        "first_run": True,
        "chosen_career": None,
        "career_readiness_score": 0,
        "previous_readiness_score": 0,
        "readiness_change": 0,
        "days_since_last_report": None,
        "closed_gaps": [],
        "remaining_gaps": [],
        "new_skills_detected": [],
        "improved_skills": [],
        "unchanged_skills": [],
        "next_milestone": None,
        "motivational_insight": "Welcome to ASPIRE! This is your first career report.",
        "semester_summary": "Baseline established.",
    }
```


---

## Appendix G: Boundary Data Pseudonymizer (`pseudonymizer.py`)

The following Python code represents the core of the privacy protection layer, ensuring student names, institutional emails, student IDs, and GitHub usernames are securely hashed using keyed HMAC-SHA256 digests before crossing any external LLM api boundaries. On the output path, a secondary regular-expression-based redaction engine is used as defense-in-depth:

```python
"""
pseudonymizer.py — Boundary pseudonymization for the AI pipeline.

Transforms student PII into stable, keyed pseudonyms before any identifier
crosses into Gemini, GitHub API tool inputs, or LLM-bound logs. Output-side
`redact_pii` scrubs cleartext PII that may have leaked back in LLM completions.
"""
from __future__ import annotations

import copy
import hmac
import hashlib
import logging
import re
from typing import Any

from app.core.config import PSEUDONYM_KEY

logger = logging.getLogger(__name__)

_PSEUDO_LEN = 12  # hex chars kept from the HMAC digest

def pseudonymize(value: str, namespace: str) -> str:
    """Keyed HMAC-SHA256 truncated to 12 hex chars.

    `namespace` means the same raw string yields different pseudonyms across
    contexts, so an attacker seeing both cannot correlate them.
    """
    if not value:
        return "unknown"
    msg = f"{namespace}:{value}".encode("utf-8")
    digest = hmac.new(PSEUDONYM_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return digest[:_PSEUDO_LEN]

def pseudonymize_student_data(data: dict) -> dict:
    """Deep-copy of `data` with every LLM-bound identifier replaced.

    Fields covered: sr_code, full_name, email, github.username,
    github.repositories[*].full_name (owner segment), session token in place
    of any human-readable name.
    """
    if not isinstance(data, dict):
        return data
    out = copy.deepcopy(data)

    if out.get("sr_code"):
        out["sr_code"] = pseudonymize(out["sr_code"], "sr_code")
    if out.get("full_name"):
        out["full_name"] = f"Student-{pseudonymize(out['full_name'], 'name')[:8]}"
    if out.get("email"):
        out["email"] = f"{pseudonymize(out['email'], 'email')}@redacted.invalid"

    gh = out.get("github")
    if isinstance(gh, dict):
        username = gh.get("username")
        gh_pseudo = pseudonymize(username, "github_user") if username else None
        if username:
            gh["username"] = gh_pseudo
        if gh.get("bio"):
            gh["bio"] = "[REDACTED]"
        for repo in gh.get("repositories", []) or []:
            if not isinstance(repo, dict):
                continue
            full = repo.get("full_name") or ""
            if "/" in full and username:
                _, _, repo_name = full.partition("/")
                repo["full_name"] = f"{gh_pseudo}/{repo_name}"
    return out

# ----- Output-side redaction -----

# Generic patterns — catch PII shapes even if not in the known set.
_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", re.IGNORECASE)
_SR_CODE_RE = re.compile(r"\b\d{2}-\d{4,6}\b")  # e.g. 21-12345

_MIN_REDACT_LEN = 3

# Common system terms that should never be redacted
NON_REDACTABLE_WORDS: frozenset[str] = frozenset({
    "git", "github", "demo", "test", "cpe", "bsu", "app", "api", "code",
    "repo", "user", "student", "developer", "engineering", "science"
})

def _collect_pii_strings(original: dict) -> list[str]:
    """Pull every PII string out of the original student_data."""
    pii: set[str] = set()

    def _add(s: Any) -> None:
        if isinstance(s, str) and len(s) >= _MIN_REDACT_LEN:
            val = s.strip()
            if val.lower() not in NON_REDACTABLE_WORDS:
                pii.add(val)

    _add(original.get("sr_code"))
    _add(original.get("email"))
    name = original.get("full_name") or ""
    _add(name)
    for tok in name.split():
        _add(tok)

    gh = original.get("github") or {}
    if isinstance(gh, dict):
        _add(gh.get("username"))
        for repo in gh.get("repositories", []) or []:
            if isinstance(repo, dict):
                _add(repo.get("full_name"))

    return sorted(pii, key=len, reverse=True)

def redact_pii(text: str, original: dict) -> str:
    """Replace any cleartext PII from original that appears in output text."""
    if not text:
        return text
    redacted = text
    for needle in _collect_pii_strings(original):
        if not needle:
            continue
        redacted = re.sub(re.escape(needle), "[REDACTED]", redacted, flags=re.IGNORECASE)
    redacted = _EMAIL_RE.sub("[REDACTED_EMAIL]", redacted)
    redacted = _SR_CODE_RE.sub("[REDACTED_SR]", redacted)
    return redacted
```
```

---

## Appendix H: Machine Learning Predictive Model Training Pipeline (`train.py`)

The following Python code defines the training script for the skillset prediction model. It connects to the PostgreSQL database, queries the student ILO score mappings, falls back to a curriculum-wide synthetic distribution (based on a Beta-distribution) if real dataset entries are sparse, fits a Multi-Output Gradient Boosting Regressor pipeline, calculates cross-validation metrics, and serializes the resulting model artifacts:

```python
"""
train.py — Train and save the skill-prediction model.

Reads real ILO data from the PostgreSQL database (instructor-entered scores)
and augments with curriculum-wide synthetic samples when sparse.
"""
from __future__ import annotations

import json
import os
import joblib
from pathlib import Path
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import KFold, cross_val_score
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from ml.config import (
    COURSE_PROFILES, COURSE_SEMESTER, SKILL_CATEGORIES,
    compute_skill_scores, ilo_weighted_avg
)

ML_ROOT   = Path(__file__).resolve().parents[1]
ARTIFACTS = ML_ROOT / "artifacts"

# Thresholds for training data augmentation
MIN_REAL_SAMPLES = 200
SYNTHETIC_SAMPLES_PER_COURSE = 30

# SQL query to pivot student scores by ILO number
_ILO_QUERY = text("""
    SELECT
        ss.student_id,
        c.subject_name  AS "Course",
        c.semester       AS "Semester",
        ROUND(AVG(CASE WHEN ai.ilo_number = 1 THEN ss.score / ai.max_score * 100 END)::numeric, 1) AS "ILO1",
        ROUND(AVG(CASE WHEN ai.ilo_number = 2 THEN ss.score / ai.max_score * 100 END)::numeric, 1) AS "ILO2",
        ROUND(AVG(CASE WHEN ai.ilo_number = 3 THEN ss.score / ai.max_score * 100 END)::numeric, 1) AS "ILO3",
        ROUND(AVG(CASE WHEN ai.ilo_number = 4 THEN ss.score / ai.max_score * 100 END)::numeric, 1) AS "ILO4"
    FROM student_scores ss
    JOIN assessment_ilos ai ON ss.ilo_id = ai.id
    JOIN assessments a      ON ss.assessment_id = a.id
    JOIN classes c           ON a.class_id = c.id
    WHERE ai.max_score > 0
    GROUP BY ss.student_id, c.id, c.subject_name, c.semester
    HAVING
        COUNT(CASE WHEN ai.ilo_number = 1 THEN 1 END) > 0 AND
        COUNT(CASE WHEN ai.ilo_number = 2 THEN 1 END) > 0 AND
        COUNT(CASE WHEN ai.ilo_number = 3 THEN 1 END) > 0 AND
        COUNT(CASE WHEN ai.ilo_number = 4 THEN 1 END) > 0
""")

def _get_sync_url() -> str:
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    if not url:
        raise RuntimeError("DATABASE_URL is not set in .env")
    return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)

def _synthesize_ilo_data(rng: np.random.Generator, per_course: int) -> pd.DataFrame:
    """Generates synthetic dataset following a beta distribution centered around 80."""
    rows: list[dict] = []
    for course in COURSE_PROFILES.keys():
        semester = COURSE_SEMESTER.get(course, 1)
        ilos = rng.beta(8.0, 2.0, size=(per_course, 4)) * 100.0
        for ilo1, ilo2, ilo3, ilo4 in ilos:
            rows.append({
                "Course": course,
                "Semester": semester,
                "ILO1": round(float(ilo1), 1),
                "ILO2": round(float(ilo2), 1),
                "ILO3": round(float(ilo3), 1),
                "ILO4": round(float(ilo4), 1),
            })
    return pd.DataFrame(rows)

def _load_ilo_data(rng: np.random.Generator) -> pd.DataFrame:
    engine = create_engine(_get_sync_url(), echo=False)
    df = pd.read_sql(_ILO_QUERY, engine)
    engine.dispose()

    if not df.empty:
        df = df.drop(columns=["student_id"])

    n_real = len(df)
    if n_real < MIN_REAL_SAMPLES:
        synth = _synthesize_ilo_data(rng, SYNTHETIC_SAMPLES_PER_COURSE)
        df = pd.concat([df, synth], ignore_index=True) if n_real else synth

    return df

def _build_training_data(df: pd.DataFrame, rng: np.random.Generator) -> tuple[pd.DataFrame, pd.DataFrame]:
    skill_cols = [f"skill__{s}" for s in SKILL_CATEGORIES]
    rows_x: list[dict] = []
    rows_y: list[dict] = []

    for _, row in df.iterrows():
        course   = str(row["Course"])
        semester = int(row["Semester"])
        ilo1, ilo2 = float(row["ILO1"]), float(row["ILO2"])
        ilo3, ilo4 = float(row["ILO3"]), float(row["ILO4"])

        rows_x.append({
            "Course": course,
            "Semester": semester,
            "ILO1": ilo1,
            "ILO2": ilo2,
            "ILO3": ilo3,
            "ILO4": ilo4,
            "ILO_avg": ilo_weighted_avg(ilo1, ilo2, ilo3, ilo4),
        })

        scores = compute_skill_scores(
            course=course, ilo1=ilo1, ilo2=ilo2, ilo3=ilo3, ilo4=ilo4,
            noise_std=5.5, rng=rng
        )
        rows_y.append({f"skill__{s}": v for s, v in scores.items()})

    return pd.DataFrame(rows_x), pd.DataFrame(rows_y, columns=skill_cols)

def _build_pipeline() -> Pipeline:
    from sklearn.preprocessing import OneHotEncoder
    preprocessor = ColumnTransformer(
        transformers=[
            ("course", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["Course"]),
        ],
        remainder="passthrough",
    )
    base_gbr = GradientBoostingRegressor(
        n_estimators=250, max_depth=4, learning_rate=0.08,
        subsample=0.8, min_samples_leaf=10, random_state=42
    )
    return Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", MultiOutputRegressor(base_gbr, n_jobs=-1)),
    ])

def train_and_save() -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(42)

    df = _load_ilo_data(rng)
    X, Y = _build_training_data(df, rng)
    y_arr = Y.to_numpy(dtype=float)

    pipeline = _build_pipeline()
    kf       = KFold(n_splits=5, shuffle=True, random_state=42)

    cv_r2   = cross_val_score(pipeline, X, y_arr, cv=kf, scoring="r2", n_jobs=-1)
    cv_mae  = -cross_val_score(pipeline, X, y_arr, cv=kf, scoring="neg_mean_absolute_error", n_jobs=-1)
    cv_rmse = np.sqrt(-cross_val_score(pipeline, X, y_arr, cv=kf, scoring="neg_mean_squared_error", n_jobs=-1))

    print(f"5-Fold CV  ->  R2: {cv_r2.mean():.4f}  |  MAE: {cv_mae.mean():.3f}")

    # Save final fit
    pipeline.fit(X, y_arr)
    joblib.dump(pipeline, ARTIFACTS / "skill_pipeline.joblib")

    # Serialize metadata
    meta = {
        "skill_categories": SKILL_CATEGORIES,
        "known_courses": list(COURSE_PROFILES.keys()),
        "feature_columns": ["Course", "Semester", "ILO1", "ILO2", "ILO3", "ILO4", "ILO_avg"],
    }
    (ARTIFACTS / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

if __name__ == "__main__":
    train_and_save()
```
```

---

## Appendix I: RAG Knowledge Base Retrieval Tool (`rag_career_tool.py`)

The following Python code represents the custom semantic search tool registered with CrewAI. It extracts query strings, converts them into high-dimensional vector embeddings, issues a pgvector cosine distance query (`<=>` operator) against the database to fetch curriculum contexts and career matches, and returns structured context back to the mapping agents:

```python
"""
rag_career_tool.py — CrewAI tool that queries the pgvector knowledge base
to retrieve semantically relevant career paths, ILOs, and curriculum context.
"""
import json
from typing import Any
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text

from app.ai.embeddings import embed_query
from app.core.config import DATABASE_URL

# Sync engine configuration for safe multi-threaded executions
_sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
_sync_engine = create_engine(_sync_url, pool_pre_ping=True)

class RAGCareerInput(BaseModel):
    query: str = Field(
        description="A natural language question or skill description to search the knowledge base."
    )
    category: str = Field(
        default="all",
        description="Filter by category: 'all', 'career_path', 'ilo', 'curriculum', 'gap_closer', 'prof_skills', etc."
    )
    top_k: int = Field(default=5, description="Number of top results to return (1-10)")

class RAGCareerTool(BaseTool):
    name: str = "rag_career_knowledge"
    description: str = (
        "Searches the ASPIRE knowledge base using semantic vector search. "
        "Returns the most relevant career paths, competency descriptions, "
        "and curriculum information based on a natural language query."
    )
    args_schema: type[BaseModel] = RAGCareerInput

    def _run(self, query: str, category: str = "all", top_k: int = 5) -> str:
        """
        Embed the query and run cosine similarity search against knowledge_chunks.
        Returns formatted results as a JSON string.
        """
        try:
            query_vec = embed_query(query)
        except Exception as e:
            return f"Embedding error: {e}"

        # Cosine distance (1 - distance = similarity) using <=> operator
        if category == "all":
            sql = text("""
                SELECT title, category, content,
                       1 - (embedding <=> CAST(:vec AS vector)) AS similarity
                FROM knowledge_chunks
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT :k
            """)
            params = {"vec": str(query_vec), "k": min(top_k, 30)}
        else:
            sql = text("""
                SELECT title, category, content,
                       1 - (embedding <=> CAST(:vec AS vector)) AS similarity
                FROM knowledge_chunks
                WHERE embedding IS NOT NULL AND category = :cat
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT :k
            """)
            params = {"vec": str(query_vec), "k": min(top_k, 30), "cat": category}

        try:
            with _sync_engine.connect() as conn:
                rows = conn.execute(sql, params).fetchall()
        except Exception as e:
            return f"Database search error: {e}"

        if not rows:
            return json.dumps({
                "query": query,
                "results": [],
                "message": "No relevant knowledge found."
            })

        results = [
            {
                "title": row.title,
                "category": row.category,
                "content": row.content,
                "similarity_score": round(float(row.similarity), 4),
            }
            for row in rows
        ]

        return json.dumps({
            "query": query,
            "results": results,
            "total_retrieved": len(results),
        }, indent=2)
```
```

---

## Appendix J: System Environment Template Configurations (`.env.example`)

The following represents the `.env.example` configurations template utilized for setting up local database connectivity, OAuth 2.0 endpoints for Google and GitHub, email delivery systems, and model-specific authentication mechanisms (AI Studio Gemini vs. GCP Vertex AI):

```env
# Database configuration (PostgreSQL)
DATABASE_URL=postgresql+asyncpg://your_db_user:your_db_password@localhost/your_db_name

# Security and session keys
SECRET_KEY=generate-a-secure-32-byte-hex-string

# Allowed CORS Origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
FRONTEND_URL=http://localhost:5173

# Google OAuth 2.0 (For student/instructor registration & login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback

# Restrict login to your institution's email domain (Optional)
ALLOWED_EMAIL_DOMAIN=g.batstate-u.edu.ph

# Resend Email Service (For email verification and advising reports)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=ASPIRE <onboarding@resend.dev>

# GitHub OAuth (For student portfolio metric collection)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:8000/api/github/callback

# Gemini LLM Authentication Configuration
# Mode 1: Google AI Studio API Key (Simpler/Recommended)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini/gemini-2.5-flash

# Mode 2: Google Cloud Vertex AI (GCP Service Account credentials)
# GOOGLE_APPLICATION_CREDENTIALS=Documents/your-service-account-key.json
# GEMINI_MODEL=vertex_ai/gemini-2.5-flash
# VERTEX_AI_PROJECT=your-gcp-project-id
# VERTEX_AI_LOCATION=asia-southeast1
```



