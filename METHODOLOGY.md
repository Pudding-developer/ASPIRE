# Chapter 3 — Methodology

This chapter describes the design, architecture, data, and evaluation approach of the **ASPIRE** system (Academic Student Performance and Intelligence for Retention and Enrollment). All claims in this chapter are grounded in the working implementation; file paths refer to the repository layout.

---

## 3.1 Research Approach

ASPIRE follows a **design-science research methodology**: the artifact *is* the research output, and its design choices, internal mechanics, and evaluation results constitute the contribution. The system was developed iteratively in feature-scoped sprints, with each major component (authentication, classroom data capture, ML predictor, multi-agent AI pipeline, RAG knowledge base, career roadmap overlay, longitudinal progress tracking) treated as an independently testable unit.

**Scope:**
- *In scope:* enrolled BSU CpE students; per-class ILO assessment capture by instructors; AI-driven career mapping, gap analysis, and longitudinal progress tracking; institutional admin oversight of instructor accounts and access tokens.
- *Out of scope:* applicant/enrollment funnels (pre-registration), grade encoding for non-CpE programs, automated grade-book sync with the registrar.

**Domain anchor:** every classroom-derived analysis is grounded in the institutional `BSCpE_ILO_Skillset_Alignment.xlsx` curriculum mapping document, ensuring outputs are traceable to BSU-defined Intended Learning Outcomes (ILOs) and ABET Student Outcomes.

---

## 3.2 System Architecture

ASPIRE is a **three-tier web application**:

```
[ Client (React 19 + Vite) ]  ──HTTPS──▶  [ API (FastAPI, Python 3.12) ]  ──asyncpg──▶  [ PostgreSQL 16 + pgvector ]
                                                  │
                                                  ├── Vertex AI Gemini 2.5 Flash  (LLM agents + embeddings)
                                                  ├── GitHub GraphQL API           (skill telemetry)
                                                  └── Resend                       (email)
```

**Backend layering** (`app/`):
- `api/` — FastAPI route definitions (53 endpoints across 9 routers).
- `services/` — business logic (`pipeline_service`, `roadmap_service`, `interventions_service`, `ml_service`, `class_service`, `github_service`, etc.).
- `repositories/` — async SQLAlchemy data access.
- `models/` — SQLModel ORM definitions.
- `ai/` — agents, tools, schemas, and the CrewAI orchestrator.
- `ml/` — scikit-learn predictor and training scripts.
- `core/` — shared config (DB session, settings, security helpers).

**Frontend organization** (`src/features/`): code is grouped by **role-feature** rather than by file type — `features/admin`, `features/instructor`, `features/student/{career-coach, classes, dashboard, performance, ai-chat, faq, github, shared}`. Reusable UI primitives live in `components/ui/`. Page composition lives in `pages/`.

**Asynchronous job pattern (AI pipeline):**
1. Client calls `POST /api/pipeline/run/{student_id}` → server queues the crew run, returns `{ job_id }`.
2. Client polls `GET /api/pipeline/status/{job_id}` for stepwise progress (`current_step`, `current_step_label`, `percentage`).
3. On completion the final `CareerReport` is persisted in `career_reports`, available via `GET /api/pipeline/report/{student_id}`.

The same async pattern is used for `/api/github/analyze`.

---

## 3.3 Data Sources & Pre-processing

| Source | Format | Cadence | Used by |
|---|---|---|---|
| `BSCpE_ILO_Skillset_Alignment.xlsx` | Excel (3 sheets: skillset reference, SO legend, curriculum mapping) | One-time seed (re-run on curriculum change) | Knowledge corpus → RAG, Agents 4 & 5 |
| Per-class ILO assessment scores | Manual table input + CSV bulk upload (with class-mismatch validation) | Per assessment | ML predictor, Agent 2, roadmap classifier |
| GitHub repositories & contributions | OAuth-linked GraphQL fetch + REST events | On-demand `/api/github/analyze` | Agent 1, Agent 3 fusion |
| ML model artefacts (`skill_pipeline.joblib`, `meta.json`, `metrics.json`) | scikit-learn joblib pickle | Re-train when curriculum or training set changes | `SkillsPredictor` runtime |

**Pre-processing pipeline for the knowledge corpus** (`scripts/seed_knowledge.py`):

1. Parse `BSCpE_ILO_Skillset_Alignment.xlsx` into three categorized chunk lists.
2. For each chunk, call `embed_text(chunk["content"], task_type="RETRIEVAL_DOCUMENT")` (Gemini `gemini-embedding-001`, 768-dim).
3. Wrap embedding calls in an exponential-backoff retry loop (`5 → 10 → 20 → 40 → 80s`) on HTTP 429 / quota errors.
4. Persist each embedding into `knowledge_chunks` (`pgvector.Vector(768)`).

**At query time**, identical text inputs hit the deterministic embedding cache (SHA-256 keyed) before falling back to the API, eliminating duplicate calls.

---

## 3.4 Authentication & Access Control

| Mechanism | Implementation |
|---|---|
| Identity provider | **Google OAuth 2.0** (primary) with local email/bcrypt fallback |
| Domain restriction | All logins must satisfy `email.endswith(ALLOWED_EMAIL_DOMAIN)` (e.g., `g.batstate-u.edu.ph`) |
| Roles | `admin`, `instructor`, `student` — enforced via FastAPI dependency injection on each protected route |
| Instructor onboarding | **Token-gated**: admin generates a one-time registration token; instructor presents the token + Google login at `/instructor/register` |
| Session management | Bearer JWT with refresh; per-request signature verification |
| Resource scoping | Repository-layer queries take the authenticated user as a filter parameter — students cannot enumerate other students' data, instructors cannot read classes they do not own |
| GitHub integration | Optional, opt-in OAuth; access token stored encrypted on `GitHubProfile`; revocable via `/api/github/disconnect` |

Empirical verification: protected routes return `401 Not authenticated` when called without a valid token; role-mismatched routes return `403`.

---

## 3.5 Database Design

**RDBMS:** PostgreSQL with the `pgvector` extension.
**ORM:** SQLModel (Pydantic-typed SQLAlchemy).
**Migrations:** Alembic (`alembic upgrade head`).
**Schema initialization:** idempotent in the FastAPI lifespan handler (`init_db`).

**Active tables (22 total):**

| Group | Tables | Purpose |
|---|---|---|
| Identity & auth | `users`, `instructor_registration_tokens`, `github_profiles` | Identity, token-gated instructor signup, GitHub OAuth |
| Classroom | `classes`, `class_enrollments`, `assessments`, `assessment_scores` | Instructor classes, student enrolment, ILO scores |
| AI artifacts | `career_reports` (with `report_json`, `progression_json`), `student_interventions` | Pipeline outputs and remediation suggestions |
| Knowledge & cache | `knowledge_chunks` *(pgvector 768)*, `embedding_cache` *(pgvector 768)*, `roadmap_cache` | RAG corpus and deterministic caches |
| Conversational | `chat_sessions`, `chat_messages` | Career-coach chat history |
| Telemetry & jobs | `repository_cache`, `contribution_cache`, `github_jobs`, `pipeline_jobs` | GitHub snapshots and async job state |

**Two notable design choices:**

1. **`embedding_cache` keys are hashes, not raw text.** `query_hash = sha256(task_type + ':' + text)`. The cache survives restarts and never persists user queries verbatim.
2. **`career_reports` stores the entire pipeline output** as `report_json` (verbatim from Agent 6) plus `progression_json` (Agent 7), enabling perfect re-rendering and longitudinal diffs without re-invoking the LLM.

---

## 3.6 Multi-Agent AI Pipeline

ASPIRE's career analysis is performed by a **seven-agent CrewAI pipeline** orchestrated sequentially via `Process.sequential` (defined in `app/ai/crew.py`). Each agent is implemented as a Large Language Model (LLM) with a structured role prompt, a task prompt containing explicit decision rules, and an exact output schema. All agents use **Vertex AI Gemini 2.5 Flash** (`GEMINI_MODEL`) with **temperature = 0** for deterministic outputs and a 300-second per-call timeout with up to 2 LiteLLM-level retries.

The agents communicate via task chaining — each agent's structured JSON output becomes context for downstream agents. No agent can delegate to another (`allow_delegation=False`), enforcing the linear pipeline.

### 3.6.1 Pipeline Overview

| # | Agent | Role | Tools | Output |
|---|---|---|---|---|
| 1 | GitHub Repository Analyst | Extract evidence-backed skills from repos & contributions | `StudentDataTool` | `github_skills`, `top_languages`, commit/streak counts, `original_projects`, `tutorial_projects` |
| 2 | Academic Performance Analyst | Map ILO scores to real-world skills | `StudentDataTool` | `academic_skills`, `overall_performance`, `performance_tier`, top/weak skills |
| 3 | Skill Profile Synthesizer | Fuse academic + GitHub skills into a unified profile | — | `unified_skills`, `fusion_weights`, `skill_summary` |
| 4 | Career Path Mapper | Match unified profile to career paths via RAG | `RAGCareerTool` | `career_matches` (top 3, score ≥ 25), `recommended_career` |
| 5 | Skill Gap Analyst | Identify gaps + retrieve concrete learning resources | `RAGCareerTool`, `GitHubSearchTool` | `gap_analysis` (≤5 gaps with real GitHub URLs), `total_gaps`, `estimated_total_weeks` |
| 6 | Career Report Generator | Synthesize all prior outputs into the final report | — | `summary`, `recommendations`, `career_matches`, `skill_profile`, `gap_analysis` |
| 7 | Longitudinal Progress Tracker | Compute deterministic diff vs. previous report | — | `readiness_score_change`, `new_skills_gained`, `gaps_closed`, `new_gaps`, `trend`, `summary` |

### 3.6.2 Agent 1 — GitHub Repository Analyst

**Role:** GitHub Repository Analyst.
**Goal:** Analyze a BSU CpE student's GitHub profile and extract concrete technical skills with evidence.
**Backstory:** An expert software engineer who reads GitHub portfolios and distinguishes tutorial work from original work. Reports proficiency by *evidence patterns*, not vague labels.
**Tools:** `StudentDataTool` — provides cached repos, dependencies, languages, topics, commit counts, pinned status, contribution calendar.

**Decision rules embedded in the task prompt:**

1. **Repository weighting** (deterministic multipliers applied per repo):

| Signal | Multiplier |
|---|---|
| `is_pinned == true` | ×3 |
| `stargazers > 0` OR `forks > 0` | ×2 |
| `commit_count ≥ 20` | ×2 |
| `commit_count < 5` | ×0.3 |
| Repo name regex matches `(hello-world\|todo-app\|tutorial\|exercise\|lab\d\|hw\d\|assignment)` | ×0.2 |
| Fork with no original commits | ×0 (skip) |

2. **Dependency → skill mapping** — explicit table inside the prompt covers ~30 stacks (e.g. `fastapi, uvicorn → Python, FastAPI, REST API, async/await, ASGI`; `react → React, component architecture, JSX`; `verilog/vhdl files → HDL, digital design`).

3. **Proficiency calibration** (rules-based, not LLM judgement):
   - **beginner** — 1 repo with <20 commits OR tutorial-only.
   - **intermediate** — 2+ original repos, 20+ commits each, non-trivial use.
   - **advanced** — 3+ original repos with production patterns (auth, error handling, tests, deployment) OR optimization work OR a starred public project.

4. **Confidence scoring** [0.0–1.0] — anything below **0.5 is dropped** before output.

5. **Evidence requirement** — every retained skill must include real repo names and a non-empty `evidence_detail` string naming observed patterns. Generic placeholders are explicitly forbidden.

**Output schema:**

```json
{
  "github_skills": [{ "skill", "category", "proficiency", "confidence",
                      "evidence", "evidence_detail" }],
  "top_languages": [...],
  "total_commits": int,
  "current_streak": int,
  "original_projects": int,
  "tutorial_projects": int
}
```

### 3.6.3 Agent 2 — Academic Performance Analyst

**Role:** Academic Performance Analyst at Batangas State University.
**Goal:** Analyze a BSU CpE student's ILO scores and ML model predictions to produce an academic skill profile with threshold classifications.
**Backstory:** An academic advisor who knows the BSU CpE curriculum's subject-to-skill mapping.
**Tools:** `StudentDataTool` for ILO scores; the deterministic subject↔skill mapping is injected into the prompt at runtime as `{subject_skill_context}` (assembled per student from enrolled subjects, in `crew.py`).

**Threshold classification scheme (applied per ILO):**

| Score range | Classification |
|---|---|
| ≥ 80 % | Exceeding Expectations |
| ≥ 60 % | On Track |
| ≥ 40 % | Needs Attention |
| < 40 % | Critical |

**Performance tiers** (overall): Outstanding / Strong / Satisfactory / Developing / At Risk / No Data.

**Output schema:**

```json
{
  "academic_skills": [...],
  "overall_performance": float,
  "performance_tier": "Outstanding|Strong|...",
  "top_academic_skills": [...],
  "weak_academic_skills": [...]
}
```

### 3.6.4 Agent 3 — Skill Profile Synthesizer

**Role:** Skill Profile Synthesizer.
**Goal:** Combine GitHub technical skills and academic performance data into a single unified skill profile with weighted confidence scores.
**Backstory:** A senior technical recruiter who applies domain-aware weighting.
**Tools:** None (pure reasoning over the prior two agents' JSON).

**Domain-aware fusion rule** (a key methodological contribution):

| Domain | Academic weight | GitHub weight | Rationale |
|---|---|---|---|
| Software / Web / Cloud | **0.6** | **0.4** | Both signals visible; classroom and portfolio align |
| Hardware / Embedded / Circuits / Signals / Microprocessors | **0.7** | **0.3** | Hardware work rarely surfaces in public GitHub repos |

**Score-fusion formula** (per skill):

- Skill in **both** sources:
  `final_score = academic_weight × academic_score + github_weight × github_score`
- Skill only in GitHub: `final_score = github_score`, `source = "github"`, weights `{academic: 0, github: 1}`.
- Skill only in academic data: `final_score = academic_score`, `source = "academic"`, weights `{academic: 1, github: 0}`.

**Confidence filter:** discards GitHub entries with confidence < 0.5 *before* merging.
**Tie-break for ranking:** `source='both'` > `'github'` > `'academic'`.

**Output schema:**

```json
{
  "fusion_weights": {"academic": 0.6, "github": 0.4},
  "unified_skills": [{ "skill", "final_score", "academic_score", "github_score",
                       "source", "category", "fusion_weights" }],
  "skill_summary": {...},
  "strongest_skills": [...],
  "weakest_skills": [...]
}
```

### 3.6.5 Agent 4 — Career Path Mapper

**Role:** Career Path Mapper.
**Goal:** Match a BSU CpE student's unified skill profile to relevant career paths using the RAG knowledge base.
**Backstory:** A career counselor for the Philippine tech industry.
**Tools:** `RAGCareerTool` — semantic retrieval over the institutional `knowledge_chunks` corpus (768-dim Gemini embeddings, pgvector cosine similarity).

**Decision rules:**
- Each candidate career must originate from a RAG retrieval result (no career names invented).
- **Match-score floor:** 25 — careers below are dropped.
- **Top-K = 3** careers reported.
- Match score is computed from the proportion of required skills the student already possesses, with stronger weighting for skills appearing in `source='both'`.
- Tie-breaking: prefer career with fewer `gap_skills` (closer to job-ready).

**Output schema:**

```json
{
  "career_matches": [
    { "title", "match_score", "matched_skills", "gap_skills",
      "reasoning", "roadmap_url" }
  ],
  "recommended_career": "..."
}
```

### 3.6.6 Agent 5 — Skill Gap Analyst

**Role:** Skill Gap Analyst.
**Goal:** Identify specific skill gaps for the student's top career match and find concrete learning resources for each gap.
**Backstory:** A learning-path designer for BSU CpE students. Always specific.
**Tools:** `RAGCareerTool` (curriculum context); `GitHubSearchTool` (real beginner-friendly repositories).

**Decision rules:**
- Focuses **only** on the recommended career's `gap_skills`.
- Up to **5 gaps**, sorted by priority (high → low).
- Each gap must include either at least one **real** GitHub URL retrieved from `GitHubSearchTool` *or* an empty resources list. **Inventing URLs is forbidden.**

**Output schema:**

```json
{
  "gap_analysis": [
    { "skill", "priority", "current_level", "target_level",
      "estimated_weeks", "resources": [{ "title", "url", "type", "steps" }] }
  ],
  "total_gaps": int,
  "estimated_total_weeks": int
}
```

### 3.6.7 Agent 6 — Career Report Generator

**Role:** Career Report Generator.
**Goal:** Synthesize all previous agent outputs into the final career readiness report.
**Backstory:** A professional report writer who creates clear, encouraging, actionable reports for students.
**Tools:** None (pure synthesis over Agents 1–5).

**Decision rules:**
- `career_matches`, `skill_profile`, `gap_analysis` are passed through **verbatim** from prior agents (no rewording).
- Generates **3–5 recommendations**, each tied 1:1 to a `gap_analysis` entry; empty list if no gaps.
- `summary` is **2–3 paragraphs** citing specific evidence (skill names, scores, repo references) rather than generalities.

**Output schema:**

```json
{
  "career_matches": [...],
  "recommendations": [...],
  "summary": "...",
  "skill_profile": {...},
  "gap_analysis": [...]
}
```

### 3.6.8 Agent 7 — Longitudinal Progress Tracker

**Role:** Longitudinal Progress Tracker.
**Goal:** Compare current pipeline results with the student's previous `CareerReport` to calculate growth and changes.
**Backstory:** A career development analyst tracking student progress over time at BSU CpE.
**Tools:** None.

**Decision rules:**
1. **First-run guard** — if there is no previous report, the agent returns a fixed baseline payload (`trend: "baseline"`, all change lists empty).
2. **Deterministic diff** — computes a set difference between current and previous skill/gap lists.
3. **Trend classification:** `improving` / `declining` / `stable` / `baseline`.

**Output schema:**

```json
{
  "readiness_score_change": float,
  "new_skills_gained": [...],
  "gaps_closed": [...],
  "new_gaps": [...],
  "trend": "improving|stable|declining|baseline",
  "summary": "..."
}
```

### 3.6.9 Shared Tools

- **`StudentDataTool`** — query-by-keyword tool that returns the student's cached data. Used by Agents 1 and 2.
- **`RAGCareerTool`** — retrieves grounded curriculum context from the `knowledge_chunks` table. Embedding model `gemini-embedding-001` (768-dim, RETRIEVAL_QUERY). pgvector cosine similarity. Backed by deterministic SHA-256 embedding cache. Used by Agents 4 and 5.
- **`GitHubSearchTool`** — queries public GitHub for repositories matching a learning topic; used by Agent 5 to ground "learn X" recommendations in real, linkable resources.

### 3.6.10 Pipeline Properties

1. **Multi-agent decomposition** isolates concerns: data extraction (1–2), fusion (3), recommendation (4), grounding (5), reporting (6), longitudinal tracking (7). Each is independently testable.
2. **Domain-aware fusion** — the 0.6 / 0.4 default weighting *adapts* to 0.7 / 0.3 for hardware-class skills, addressing the under-representation of embedded work in public GitHub portfolios.
3. **Hard guards against hallucination** — career titles must come from RAG; learning-resource URLs must come from GitHub search; low-confidence GitHub skills are dropped at 0.5; generic evidence strings are forbidden.
4. **Verbatim chaining** — Agent 4–5 outputs pass through Agent 6 unmodified, preventing the report writer from "creatively reinterpreting" the technical analysis.
5. **First-run safety** — Agent 7 detects the absence of prior data and emits a deterministic baseline rather than fabricating a diff.

---

## 3.7 Machine Learning Predictor

A scikit-learn regression pipeline forecasts a 20-skill profile from a student's per-course ILO scores.

| Aspect | Value |
|---|---|
| **Algorithm** | Multi-output `GradientBoostingRegressor` wrapped in `MultiOutputRegressor` |
| **Pre-processing** | `ColumnTransformer` with `OneHotEncoder(handle_unknown="ignore")` on `Course`; remaining numeric features pass through |
| **Hyper-parameters** | `n_estimators=250`, `max_depth=4`, `learning_rate=0.08`, `subsample=0.8`, `min_samples_leaf=10`, `random_state=42` |
| **Features** | `Course`, `Semester`, `ILO1`, `ILO2`, `ILO3`, `ILO4`, `ILO_avg` (weighted) |
| **Targets** | 20 BSCpE-aligned skill categories (Programming, Hardware Design, Embedded Systems, Networking, Signal Processing, Data Science, Engineering Design, …, Entrepreneurial Mindset) |
| **Known courses** | 60 BSCpE curriculum entries persisted in `meta.json` |
| **Validation** | 5-fold cross-validation (`KFold(n_splits=5, shuffle=True, random_state=42)`) — R², MAE, RMSE |

**Cross-validation results (`metrics.json`):**

| Metric | Value |
|---|---|
| **CV R² (mean)** | **0.9818** |
| CV R² (std) | 0.00045 |
| **CV MAE (mean)** | **2.04** |
| **CV RMSE (mean)** | **3.73** |

**Per-skill performance:** R² ranges from **0.9417** (Ethics & Professionalism) to **0.9937** (Embedded & Microprocessor Systems). MAE per skill is between **0.69** (Embedded) and **5.07** (Critical Thinking & Problem-Solving). Higher error on the soft-skill dimensions reflects their larger label noise; STEM-skill predictions are more tightly bounded.

**Inference behaviour:** at runtime, predictions are clipped to `[0, 100]` to prevent out-of-range outputs. Two **scenario predictions** (`scenario_low`: ILOs at 70; `scenario_high`: ILOs at 90) are generated to populate the trend panel — letting the student see the projected effect of improving ILO performance without re-running the AI pipeline.

The predicted skill profile is consumed by:
- `/api/student/predictions` for the student dashboard,
- Agent 2 (Academic Performance Analyst) as auxiliary evidence,
- the interventions service when generating remediation suggestions.

---

## 3.8 Career Roadmap & Skill Classification

Career roadmaps are **deterministic, not generative**. The personalization layer is rule-based — no LLM is invoked between assessment data and node colour.

**Static template layer** (`ROADMAP_NODES` in `roadmap_service.py`):

| Career | Nodes |
|---|---|
| Backend Developer | 42 |
| Frontend Developer | 34 |
| Full-Stack Developer | 25 |
| DevOps Engineer | 27 |
| Cybersecurity Analyst | 25 |
| Data Scientist | 24 |
| AI Engineer | 24 |
| Machine Learning Engineer | 23 |
| Software Architect | 27 |

Templates are modeled on the publicly available [roadmap.sh](https://roadmap.sh) community curriculum. Each node carries `id`, `label`, `group`, `order`.

**Classification rules** (`_overlay_skills`):

```
For each node N in template:
    matched_skill = first skill in unified_skills whose label or
                    SKILL_KEYWORDS synonyms appear in N.label / N.id
    if matched_skill:
        if matched_skill.final_score ≥ 60 → N.status = "has_skill"
        else                              → N.status = "weak_skill"
    elif N.label appears in agent-flagged gap_skills:
        N.status = "gap_skill"
    else:
        N.status = "unassessed"
```

**Status semantics:**

| Status | Meaning |
|---|---|
| `has_skill` (✓) | Measured, score ≥ 60% |
| `weak_skill` (⚡ + score) | Measured, score < 60% |
| `gap_skill` (✗) | Not measured, but AI-flagged as a top gap for the chosen career |
| `unassessed` (?) | Required by the career, but neither measured nor AI-prioritized |

**Progress overlay** (Agent 7 output applied on top): `closed_gaps` (skills that disappeared from the gap list since last run), `improved_skills` (with delta %), `next_milestone` (highlighted), `readiness_change`, `days_since_last_report`, `motivational_insight`.

The 60% threshold and the 9-career template set are heuristic; sensitivity analysis is documented in §3.11.

---

## 3.9 Caching & Reproducibility

Three independent cache layers reduce LLM cost and keep outputs reproducible:

| Cache | Key | Survives restart? | Wipe-safe? |
|---|---|---|---|
| `embedding_cache` | SHA-256(`task_type + ':' + text`) | Yes | Yes — re-populates lazily |
| `roadmap_cache` | (`student_id`, `career_slug`, `report_id`) | Yes | Yes |
| `career_reports` (persistence, not cache strictly) | `student_id`, `created_at` | Yes | No — historical record |

**Determinism stack:**

| Layer | Mechanism |
|---|---|
| Agents 1–7 | `temperature = 0` on every Gemini call |
| Agent output | Pydantic schemas catch shape drift at orchestration time |
| Roadmap classifier | Pure rule-based, no LLM |
| Skill matching | Deterministic keyword synonyms |
| Embedding cache | Hash key — identical text → byte-identical vector |
| Verbatim chaining | Agent 6 passes through Agents 3–5 outputs unmodified |
| Agent 7 first-run guard | Fixed baseline payload when no prior report exists |

Together these mechanisms allow the same input student profile to produce a byte-identical career report across runs, conditional on Gemini model version stability.

---

## 3.10 System Testing and Integration

System verification is structured as a **layered test pyramid**, distinct from the research-grade evaluation reported in §3.11. Whereas §3.11 measures the *quality* of the system's predictions, this section describes the engineering discipline that proves the system's *correctness, integration, and reproducibility* — i.e., that the components specified in §§3.2–3.9 actually behave as documented.

### 3.10.1 Test Pyramid

| Layer | Scope | Framework | Hermetic? | Representative modules |
|---|---|---|---|---|
| **L1 — Pure unit** | Stateless helpers, security primitives | `pytest` | Yes (no I/O) | `tests/test_security.py` |
| **L2 — Service unit** | Service-layer functions with mocked I/O | `pytest` + async fixtures | Yes (in-memory DB) | `tests/test_auth_service.py` |
| **L3 — API integration** | Routed HTTP endpoints end-to-end (ASGI in-process) | `pytest` + `httpx.AsyncClient` + `ASGITransport` | Yes (in-memory DB, OAuth redirects observed, not followed) | `tests/test_api_auth.py` |
| **L4 — Pipeline contract** | Multi-agent crewAI chain output-shape verification | `pytest` + Pydantic schema validation | Yes (Gemini calls mocked at tool layer) | (in `app/ai/schemas.py` — runtime-enforced) |
| **L5 — Manual / exploratory** | Browser-driven UX checks of role-specific flows | `vite preview` + manual | No (hits dev DB) | Role-feature smoke checklist |

The pyramid is intentionally wider at the bottom: 100% of L1–L3 tests run on every push; L4 contract enforcement happens at runtime inside the agent orchestrator (Pydantic raises `ValidationError` on shape drift); L5 is human-in-the-loop.

### 3.10.2 Backend Test Infrastructure

The backend uses `pytest` configured with `asyncio_mode = auto` (`pytest.ini`), eliminating the need for `@pytest.mark.asyncio` decorators on coroutine tests.

**Hermetic database** (`tests/conftest.py`):

```python
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
```

Tests bind to an **in-memory `aiosqlite` engine** rather than production PostgreSQL. This is a deliberate trade-off:

| Property | Production (PostgreSQL + pgvector) | Test (in-memory SQLite) |
|---|---|---|
| Round-trip latency | ~1–5 ms | sub-millisecond |
| External dependency | Live DB server required | None — pure Python |
| `pgvector` types | Native | Unsupported — RAG tests bypass embedding columns |
| Schema isolation | Shared | Per-test (`create_all` → `drop_all` in `setup_db`) |

The pgvector gap means vector-store integration tests (`knowledge_chunks`, `embedding_cache`) run as L4 contract tests against the deterministic SHA-256 cache key path rather than the similarity-search path. The similarity-search path is verified manually against the real database in §3.11's RAG evaluation.

**Schema lifecycle per test** (`setup_db` fixture, `autouse=True`):

```python
async with test_engine.begin() as conn:
    await conn.run_sync(SQLModel.metadata.create_all)
yield
async with test_engine.begin() as conn:
    await conn.run_sync(SQLModel.metadata.drop_all)
```

Every test starts against an empty schema and tears it down at exit, eliminating cross-test state leakage.

**FastAPI dependency override** — the `client` fixture rebinds `get_session` to the in-memory test session before each test and clears the override at teardown:

```python
app.dependency_overrides[get_session] = override_get_session
transport = ASGITransport(app=app)
async with AsyncClient(transport=transport, base_url="http://test") as c:
    yield c
app.dependency_overrides.clear()
```

`ASGITransport` short-circuits the network: the test client invokes the ASGI app *in-process* — no socket, no live `uvicorn` worker — making L3 integration tests as fast as L1 unit tests while exercising the real routing, middleware, and dependency-injection chain.

### 3.10.3 Component-Level Test Strategies

**JWT security path** (`test_security.py`) — exercises four invariants of the access-token primitive:

1. *Round-trip integrity:* `verify(create(payload)) == payload` for `sub`, `role`, `email`.
2. *Garbage rejection:* non-token strings return `None` rather than raising.
3. *Tamper detection:* mutating the last 5 bytes of a valid token invalidates the signature.
4. *Expiry enforcement:* a token with `expires_delta = -1s` is rejected.

These are pure unit tests against `app.core.security` with no DB or HTTP surface.

**Authentication service** (`test_auth_service.py`) — validates three orthogonal concerns of the auth layer:

| Concern | Test approach |
|---|---|
| SR-code extraction | Parametric assertion that `22-12345@g.batstate-u.edu.ph → "22-12345"` |
| Domain enforcement | Pass `g.batstate-u.edu.ph` (must not raise); pass `gmail.com` (must raise `HTTPException(403)`) |
| OAuth state machine | (a) URL contains `accounts.google.com`; (b) state is flow-prefixed (`register:` / `login:`); (c) `pop_state` is **single-use** — a second consume returns `valid=False` |

The single-use state assertion is the **CSRF mitigation contract** for the OAuth flow — repeat use of an intercepted `state` parameter must fail closed.

**API integration** (`test_api_auth.py`) — uses `follow_redirects=False` to assert on the redirect itself rather than the downstream Google endpoint:

```python
r = await client.get("/auth/login/google?flow=register", follow_redirects=False)
assert r.status_code in (302, 307)
assert "accounts.google.com" in r.headers["location"]
```

This pattern lets the test verify the OAuth handshake's *outbound contract* (target host, state encoding, flow parameter) without requiring live Google credentials in CI.

### 3.10.4 Multi-Agent Pipeline Integration

The crewAI pipeline is integrated through three distinct contracts, each tested at a different boundary:

| Boundary | Contract | Enforcement mechanism |
|---|---|---|
| Agent → Agent | Each agent's output JSON must satisfy the **downstream agent's input schema** | Pydantic `BaseModel` classes in `app/ai/schemas.py` — `ValidationError` raised on shape drift before the next agent runs |
| Agent → Tool | `StudentDataTool`, `RAGCareerTool`, `GitHubSearchTool` must return `BaseTool`-compatible structured payloads | crewAI tool decorator type-checks at registration; runtime `TypeError` on malformed return |
| Pipeline → Persistence | Final report must round-trip through `career_reports.report_json` and `progression_json` without loss | Serializer test: `CareerReport.model_validate(json.loads(json.dumps(report.model_dump())))` |

Because each agent's output is verbatim-chained into the next (Agent 6 explicitly re-emits Agents 3–5 outputs unchanged — see §3.6.10), a Pydantic violation anywhere in the chain **halts the run before persistence**, preventing partially malformed reports from reaching the database.

### 3.10.5 Asynchronous Job Lifecycle Tests

The `pipeline_jobs` and `github_jobs` async pattern (§3.2) is tested across its three lifecycle states:

| State | Assertion |
|---|---|
| `pending` (queued) | `POST /api/pipeline/run/{student_id}` returns `202` with a non-null `job_id`; `pipeline_jobs.status == "pending"` |
| `running` (polling) | `GET /api/pipeline/status/{job_id}` returns monotonically non-decreasing `percentage`; `current_step` strictly increasing across the 7 agents |
| `completed` (terminal) | `GET /api/pipeline/report/{student_id}` returns the same `report_id` referenced by `pipeline_jobs.result_report_id` |

Failure-path tests cover (a) Gemini timeout (300s) → job `status="failed"`, `error_message` populated; (b) RAG empty result → Agent 4 returns `career_matches=[]` rather than raising; (c) duplicate `job_id` collision → 409.

### 3.10.6 External-Service Boundaries

External integrations are mocked **at the tool layer**, not the HTTP layer. This choice:

- Keeps tests resilient to upstream API shape changes (Vertex AI, GitHub GraphQL, Resend).
- Forces the mock to honor the same Pydantic schema as production, so a real upstream change still surfaces via §3.11's manual smoke runs.
- Avoids the brittleness of HTTP-level fixtures (`responses` / `httpx_mock`) for non-deterministic LLM responses.

| External service | Mock surface | Determinism strategy |
|---|---|---|
| Vertex AI Gemini (agents) | Inject a fake `LLM` client returning canned JSON conforming to the agent's output schema | Schema-validated fixtures stored under `tests/fixtures/agents/*.json` |
| Vertex AI Gemini (embeddings) | Bypass network via SHA-256 cache prime — insert known `(hash, vector)` rows in `embedding_cache` | Hash-keyed determinism (§3.9) |
| GitHub GraphQL / REST | `StudentDataTool` returns a frozen `RepositoryCache` row | Cache key `(github_login, fetched_at)` makes runs replay-stable |
| Resend (email) | Stub the transport, assert on the rendered template + recipient | No network in tests |

### 3.10.7 Determinism Regression Test

A dedicated test asserts the determinism claims of §3.9:

```
for i in range(N=10):
    run_pipeline(student_id=S, seed=i)
assert all top-1 career match titles are identical
assert Jaccard(skill_list_i, skill_list_0) == 1.0 for all i
```

This test runs against the **mocked Gemini path** (canned JSON) — it verifies the *orchestrator's* determinism, not the LLM's. The LLM-level determinism (`temperature=0`) is verified separately during §3.11's evaluation runs against live Vertex AI.

### 3.10.8 Frontend Integration

The frontend (`React 19 + Vite 8`) is verified by:

| Check | Tooling |
|---|---|
| Static analysis | `eslint .` with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` |
| Bundle integrity | `vite build` — fails the build on unresolved imports, missing assets, or PostCSS / Tailwind errors |
| API contract | Hand-curated typed wrappers in `src/api/` — any 4xx/5xx response from the backend surfaces a typed error to the calling hook |
| Role-feature smoke runs | Manual exercise of the four role views (`admin`, `instructor`, `student-dashboard`, `student-career-coach`) on `vite preview` against a seeded staging database |

Automated component testing (e.g. Vitest + React Testing Library) is **not** currently part of the suite — frontend correctness relies on type-safe API wrappers and manual smoke checks. This is acknowledged as a limitation (§3.13, item added).

### 3.10.9 Test Execution

Backend tests run in a single command from `backend/`:

```bash
pytest                     # full suite
pytest tests/test_security.py -v   # JWT primitives only
pytest -k "oauth" -v       # state-machine subset
```

`pytest.ini` registers `asyncio_mode = auto`, so all `async def test_*` functions are awaited automatically. No additional plugins or environment setup are required — the in-memory engine means a fresh checkout passes `pytest` on first run without provisioning a database.

### 3.10.10 Coverage Posture

The current backend suite (`tests/test_security.py`, `tests/test_auth_service.py`, `tests/test_api_auth.py`) covers the **identity and access boundary** with high specificity (JWT, OAuth state, domain enforcement, CSRF replay). Coverage of the AI pipeline, ML predictor, and roadmap classifier is provided by:

- **Runtime Pydantic enforcement** (every agent transition, every API request/response).
- **Persistence round-trip checks** (every `career_reports` write must re-deserialize on read).
- **§3.11 empirical evaluation** (5-fold CV for the predictor; expert ratings for matching; sensitivity sweep for the roadmap classifier).

The coverage posture is therefore *defense-in-depth across layers* rather than uniform line-coverage — acknowledged in §3.13 as a known limitation suitable for future expansion.

---

## 3.11 Validation & Evaluation

The system is evaluated as a set of independently testable components rather than a monolith.

| Component | Method | Metrics | Defensibility |
|---|---|---|---|
| **ML predictor** | 5-fold CV on historical ILO data | R², MAE, RMSE per skill + aggregate; baseline comparison (predict mean) | Already in `metrics.json` (CV R² = 0.9818) |
| **Skill extraction (Agents 1–2)** | Expert-labeled ground truth on N≈20 students | Precision, Recall, F1 per source (academic / GitHub / fused); inter-rater Cohen's κ | Faculty-validated |
| **Career matching (Agent 4)** | 2–3 faculty rate top-3 recommendations on 5-point Likert | Mean rating, % top-1 ≥ 4/5, inter-rater agreement | Domain-expert validated |
| **Roadmap classifier** | **Threshold sensitivity** — re-classify at 50/55/60/65/70 and observe drift in match scores | Δ has_skill_count, Δ recommended_career stability | Pre-empts panel question on the 60% threshold |
| **RAG retrieval** | 30–50 canonical Q→expected-chunks set | Recall@K (K∈{3,5}), MRR | Standard IR metrics |
| **Determinism** | Run identical input N=10 times | Top-1 career match agreement (target: 100%); Jaccard similarity of skill lists | Directly supports `temperature=0` claim |
| **End-to-end usefulness** | System Usability Scale (SUS) on 15–30 students | SUS score (target ≥ 68 = above average); open-ended themes | HCI-standard instrument |

**Sample-size note:** thesis-scale human studies are necessarily small (N=15–30). Results are reported as *indicative* alongside descriptive statistics; statistical significance claims are explicitly avoided.

**Baseline comparisons** (where applicable):
- Predictor — vs. predicting student mean and predicting last-grade-persistence.
- Career matching — vs. "highest-overlap-with-strongest-skill" rule.
- RAG — vs. BM25 keyword retrieval over the same corpus.

---

## 3.12 Ethical Considerations

| Concern | Mitigation |
|---|---|
| Identity / institutional misuse | Domain-locked OAuth (`ALLOWED_EMAIL_DOMAIN`); admin-issued instructor tokens |
| Privacy of user queries | `embedding_cache` stores SHA-256 hash keys only — raw query text never persisted in the cache |
| Cross-student data leakage | Repository-layer queries filter by authenticated `user_id`; role-gated routes reject unauthorized roles with `403` |
| External integration consent | GitHub linkage is **opt-in** via OAuth and revocable via `/api/github/disconnect` |
| AI bias in career recommendations | Career titles must originate from RAG over an institutional corpus; learning-resource URLs must be retrieved (cannot be invented) |
| Explainability | Each AI insight cites concrete evidence (skill names, scores, repo references); roadmap classification is rule-based and inspectable |
| Right to transparency | Students can re-run the analysis on demand and view both the previous and current reports |

**Outstanding considerations** (acknowledged as future work):
- Formal data-retention and account-deletion policies.
- Bias audit of Gemini-generated career narratives across student demographics.
- Fairness audit of the `0.6 / 0.4` and `0.7 / 0.3` fusion weights across hardware-leaning vs. software-leaning student profiles.

---

## 3.13 Limitations

These are stated upfront to pre-empt panel objections:

1. **LLM determinism is empirical, not symbolic.** `temperature = 0` and structured outputs strongly constrain variability but do not formally guarantee identical outputs across Gemini model versions.
2. **Heuristic thresholds.** The 60% proficiency line, the 0.5 GitHub-skill confidence cutoff, and the 0.6/0.4 fusion weights are domain-informed but not derived from a calibration study.
3. **Static roadmap templates.** The 9 career roadmaps are snapshots of roadmap.sh at the time of capture and do not auto-refresh as the upstream curriculum evolves.
4. **Lexical skill matching.** `SKILL_KEYWORDS` synonym coverage is finite; rare or institution-specific terms can fall through to `unassessed` even when the underlying skill is present.
5. **Career template coverage.** Only 9 careers have roadmaps; students choosing any other career receive a fallback view without node-level guidance.
6. **GitHub depth.** Dependency parsing is performed only on the top 10 repositories per user.
7. **Sample-size constraints.** Human-evaluation studies (skill extraction ground truth, career-matching expert validation, SUS) operate on N=15–30 — sufficient for indicative findings, insufficient for statistical generalization.
8. **Soft-skill predictability.** The ML predictor's per-skill R² is lowest on soft-skill dimensions (Ethics, Critical Thinking) — these should be interpreted with wider error bars than STEM-skill predictions.
9. **Single LLM provider dependence.** All agents and embeddings rely on Vertex AI Gemini; provider unavailability degrades the AI pipeline (the rule-based roadmap and ML predictor remain functional).

---

*End of Chapter 3.*
