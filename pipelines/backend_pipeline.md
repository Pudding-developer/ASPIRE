# ASPIRE — End-to-End Backend Pipeline

This document describes the **end-to-end backend pipeline** that turns a single `POST /api/pipeline/run/{student_id}` call into a persisted, deterministically-scored `CareerReport`. It mirrors the structure of [frontend_pipeline.md](frontend_pipeline.md) and is intended as a self-contained reference for papers, design reviews, and onboarding.

The backend pipeline is layered into seven tiers (B1–B7). Each tier has a single responsibility, the boundaries between them are explicit, and the cross-cutting concerns (caching, pseudonymization, deterministic scoring) are factored into their own modules so they can be reasoned about independently.

---

## 1. Overview

The ASPIRE backend is a FastAPI application backed by PostgreSQL (asyncpg/SQLModel), a scikit-learn ML model served from a local artifacts directory, a pgvector knowledge base, and a CrewAI multi-agent system using Gemini via LiteLLM. The career-mapping pipeline is the system's most coordinated workflow: it spans HTTP, async DB I/O, a synchronous thread for the AI crew, deterministic post-processing, and persistence — while remaining cancellable, cacheable, and PII-safe.

End-to-end, the pipeline is responsible for:

1. **Authorizing and admitting** a pipeline run (one job at a time per student).
2. **Collecting** the student's academic scores, GitHub profile, repository cache, contribution cache, and ML-aggregated skill predictions.
3. **Short-circuiting** when nothing has changed since the last successful run (HMAC-keyed input hash).
4. **Pseudonymizing** every identifier that will cross the AI boundary.
5. **Running the seven-agent CrewAI pipeline** with per-agent caches for the two most expensive (and non-deterministic) agents.
6. **Re-deriving** all numeric outputs in Python so the same inputs always produce the same scores.
7. **Persisting** the report, broadcasting activity events, and writing a human-readable Markdown artifact.

The full data flow is summarized in Figure 1.

### Figure 1 — Layered architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  B1 — HTTP Layer (FastAPI routers)                                   │
│       pipeline_routes · student_routes · github_routes · auth_routes │
└──────────────────────────────────────────────────────────────────────┘
                      │  asyncio.create_task(run_pipeline_job(...))
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  B2 — Orchestration Layer (pipeline_service)                         │
│       admission · data fetch · input-hash cache · job state machine  │
└──────────────────────────────────────────────────────────────────────┘
                      │  asyncio.to_thread(_run_crew_with_sync_db)
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  B3 — AI Layer (crew.py + 7 agents)                                  │
│       GitHub → Academic → Synthesizer → Career → Gap → Report →      │
│       Progress (CrewAI sequential)                                   │
└──────────────────────────────────────────────────────────────────────┘
                      │  raw JSON outputs (report + progress)
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  B4 — Determinism Layer (scoring.py + caches)                        │
│       skill fusion · career match recompute · per-agent caches       │
│       PII redact · _ensure_all_careers_present · _enrich_recs        │
└──────────────────────────────────────────────────────────────────────┘
                      │  cleaned & re-scored report dict
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  B5 — Persistence Layer (SQLModel + repositories)                    │
│       PipelineJob · CareerReport · GithubSkillCache ·                │
│       AcademicSkillCache · knowledge_chunks (pgvector)               │
└──────────────────────────────────────────────────────────────────────┘
                      │  emit_career_updated · emit_skill_milestone
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  B6 — Activity & Artifact Layer                                      │
│       activity feed · Markdown report (artifacts/)                   │
└──────────────────────────────────────────────────────────────────────┘
                      │  GET /pipeline/status · GET /pipeline/report
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  B7 — Read Path                                                      │
│       status polling · report retrieval · ML predictions             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-end sequence

```
Frontend           Router              Service            Crew             DB
  │                  │                   │                  │              │
  │ POST /run/:id    │                   │                  │              │
  ├─────────────────►│ auth + ownership  │                  │              │
  │                  ├──────────────────►│ get_running_job  │              │
  │                  │                   ├─────────────────────────────────┤
  │                  │                   │  (409 if running)│              │
  │                  │                   ├─► create_job ────────────────► PipelineJob
  │ {job_id}         │◄──────────────────┤                  │              │
  │◄─────────────────┤  asyncio.create_task(run_pipeline_job(...))         │
  │                  │                   │                  │              │
  │                  │       ┌───────────┤ run_pipeline_job │              │
  │                  │       ▼           │                  │              │
  │                  │  _fetch_student_data ─────────────────────────────► profile, scores, github
  │                  │  build_subject_skill_context                        │
  │                  │  _compute_input_hash (HMAC-SHA256 of inputs)        │
  │                  │                   │                  │              │
  │                  │  if hash matches previous AND !force:               │
  │                  │      mark completed (no_change) ────────────────► PipelineJob
  │                  │      return                                         │
  │                  │                   │                  │              │
  │                  │  asyncio.to_thread(_run_crew_with_sync_db) ─────────┤
  │                  │       │           │                  │              │
  │                  │       │           │  pseudonymize ───►               │
  │                  │       │           │  cache-aware retry loop:        │
  │                  │       │           │    Agent 1 (or cache HIT)       │
  │                  │       │           │    Agent 2 (or cache HIT)       │
  │                  │       │           │    Agents 3..7 (sequential)     │
  │                  │       │           │  redact_pii(report, progress)   │
  │                  │       │           │  _parse_combined_output         │
  │                  │       │           │    + recompute_unified_skills   │
  │                  │       │           │    + recompute_career_matches   │
  │                  │       │           │                  │              │
  │                  │  pipeline_result (dict)                             │
  │                  │  _ensure_all_careers_present                        │
  │                  │  _enrich_all_careers_with_recommendations           │
  │                  │  non-decreasing match-score guard                   │
  │                  │  CareerReport(...) ─────────────────────────────► career_reports
  │                  │  activity_service.emit_career_updated ────────────► activities
  │                  │  emit_skill_milestone (per crossed skill)           │
  │                  │  write_markdown_report_to_artifacts ──────────────► artifacts/*.md
  │                  │  update_job(status=completed, percentage=100)       │
  │                  │                   │                  │              │
  │ GET /status/:job (every 3s)          │                  │              │
  ├─────────────────►│  return PipelineJob fields                          │
  │ GET /report/:id  │                   │                  │              │
  ├─────────────────►│  get_latest_report ──────────────────────────────► career_reports
  │◄─────────────────┤  JSON(no-store)   │                  │              │
```

Three terminal states are emitted by the orchestrator:

| Terminal state | Trigger | DB effect |
|---|---|---|
| `completed` (fresh)   | Crew ran, report parsed & re-scored | `PipelineJob.status='completed'`, new `CareerReport` row |
| `completed` (cached)  | `_input_hash` matched previous report and `force=false` | `PipelineJob.status='completed'`, `current_step='No new data — returning previous report'`, **no new report row** |
| `failed`              | Crew raised non-rate-limit exception, parse failure, or explicit cancel | `PipelineJob.status='failed'`, `error` field populated |

---

## 3. Layer-by-layer

### B1 — HTTP Layer (FastAPI routers)

The router thin-wraps the orchestrator and never executes business logic itself. All endpoints depend on `get_current_student` for JWT auth and enforce `current_user.id == student_id` so a student can only operate on their own resources.

[pipeline_routes.py](../backend/app/api/pipeline_routes.py):

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/pipeline/run/{student_id}?force=bool` | Admit & launch a job. Returns `{job_id}` with `202 Accepted`. Rejects with `409` if a job is already running for this student. |
| `POST` | `/pipeline/cancel/{student_id}` | Cancel the currently running task (`asyncio.Task.cancel()` + DB update). |
| `GET`  | `/pipeline/status/{job_id}` | Poll job status (used by the frontend at 3 s cadence). |
| `GET`  | `/pipeline/report/{student_id}` | Latest report. Served with `Cache-Control: no-store`. |
| `GET`  | `/pipeline/reports/{student_id}` | All historical reports (most-recent first). |

Admission rule (`run_pipeline`):

```
if current_user.id != student_id        → 403
if get_running_job(student_id)          → 409
job = create_job(student_id)            # row inserted, status='pending'
asyncio.create_task(run_pipeline_job(...))  # detached background task
return {"job_id": job.id}
```

The handler returns immediately; the actual work happens in a fire-and-forget task. This makes the HTTP request finite (~50 ms) and lets the frontend poll status without holding a long-lived connection.

### B2 — Orchestration Layer (`pipeline_service`)

[pipeline_service.py](../backend/app/services/pipeline_service.py) owns the entire job lifecycle: data collection, hash gating, thread dispatch, post-processing, persistence, and event emission.

#### Data collection — `_fetch_student_data`

A single async function pulls everything the AI needs:

| Source | Model | Notes |
|---|---|---|
| Identity | `User` | sr_code, full_name, email — pseudonymized before reaching B3. |
| Academic scores | `StudentScore ⋈ Assessment ⋈ AssessmentILO ⋈ Class` | Joined into a normalized record per assessment with `percentage = score / max_score × 100`. |
| GitHub profile | `GithubProfile` | username, bio, public-repo count, followers. |
| Repositories | `RepositoryCache` | languages, dependencies, topics, commit counts, stars, pinned flag. |
| Contributions | `ContributionCache` | total commits, total contributions, current/longest streak. |

This is the only place B2 talks to per-student tables; everything downstream consumes the returned dict.

#### Input-hash short-circuit — `_compute_input_hash`

```
payload = { academic_scores, github, subject_context }
input_hash = HMAC-SHA256(key=SECRET_KEY, msg=json.dumps(payload, sort_keys=True))
```

If the previous report's `_input_hash` field matches and `force=false`, the job is marked `completed` with `current_step='No new data — returning previous report'` and **no new row is inserted**. The frontend distinguishes this state and surfaces "Run Anyway" to bypass the cache via `force=true`.

The key (`SECRET_KEY` from [config.py](../backend/app/core/config.py)) makes a cached report from one deployment unusable as a replay in another.

#### Progress milestones

The orchestrator updates `PipelineJob.current_step` and `PipelineJob.percentage` at well-known checkpoints so the frontend can render a meaningful progress bar:

```
 5%  — "Collecting student data..."
10%  — "Analyzing GitHub repositories..."
25%  — "Processing academic performance..."
40%  — "Synthesizing skill profile..."
55%  — "Mapping career paths..."
70%  — "Analyzing skill gaps..."
85%  — "Generating career report..."
95%  — "Tracking your progress..."
100% — "Career report ready"  |  "No new data — returning previous report"  |  failed
```

The labels map 1:1 to the seven agents in B3.

#### Thread dispatch

CrewAI's `kickoff()` is synchronous, so the crew runs inside `asyncio.to_thread(_run_crew_with_sync_db)`. A synchronous SQLAlchemy `Session` is constructed from a sync URL (derived by stripping `+asyncpg`) so agents and the per-agent caches can touch the DB without re-entering the event loop.

#### Cancel & orphan safety

- An in-memory `_running_tasks: {student_id: asyncio.Task}` registry lets `cancel_running_job` reach the live task; the `CancelledError` branch writes `status='failed'`, `error='Cancelled by user'`.
- `get_running_job` auto-fails jobs older than `ORPHAN_THRESHOLD = 10 minutes` so a server crash mid-run doesn't permanently block re-runs.

### B3 — AI Layer (`crew.py` + 7 agents)

[crew.py](../backend/app/ai/crew.py) assembles a sequential CrewAI pipeline. Each agent is a small module under [backend/app/ai/agents/](../backend/app/ai/agents/) with its own LLM config, role, backstory, and task prompt. The chain is strictly sequential — each task receives prior tasks' outputs as context.

| # | Agent | File | Purpose |
|---|---|---|---|
| 1 | GitHub Analyzer        | [github_agent.py](../backend/app/ai/agents/github_agent.py) | Weighs repos (pinned ×3, popular ×2, tutorial ×0.2, fork-no-commits ×0), maps dependencies → skills, calibrates proficiency, drops low-confidence skills (< 0.5). |
| 2 | Academic Analyzer      | [academic_agent.py](../backend/app/ai/agents/academic_agent.py) | Reads aggregated ILO summaries and maps subjects → skills via a deterministic injected mapping table (`{subject_skill_context}`). |
| 3 | Skill Synthesizer      | [skill_agent.py](../backend/app/ai/agents/skill_agent.py) | Merges GitHub + Academic skills (60% academic / 40% GitHub, with 100/0 fallback for hardware skills absent from GitHub). |
| 4 | Career Mapper          | [career_agent.py](../backend/app/ai/agents/career_agent.py) | Queries the pgvector knowledge base via `rag_career_knowledge` (three queries for full sweep) and scores every career, not just top-N. |
| 5 | Gap Analyst            | [gap_agent.py](../backend/app/ai/agents/gap_agent.py) | Selects the top-5 gaps for the recommended career and finds GitHub learning resources via `github_search`. |
| 6 | Report Generator       | [report_agent.py](../backend/app/ai/agents/report_agent.py) | Synthesizes all prior outputs into the final `CareerReport` JSON expected by the frontend. |
| 7 | Progress Tracker       | [progress_tracker_agent.py](../backend/app/ai/agents/progress_tracker_agent.py) | Diffs the new report against the previous report to produce growth/regression deltas. |

#### Tools

| Tool | File | Used by | Purpose |
|---|---|---|---|
| `student_data_lookup` | [student_data_tool.py](../backend/app/ai/tools/student_data_tool.py) | Agents 1, 2 | Returns pre-loaded (pseudonymized) student data. Pre-aggregates academic scores in Python so the LLM never sees raw rows. |
| `rag_career_knowledge` | [rag_career_tool.py](../backend/app/ai/tools/rag_career_tool.py) | Agent 4 | Cosine search against `knowledge_chunks` via pgvector (`<=>` operator) with category filters. |
| `github_search` | [github_search_tool.py](../backend/app/ai/tools/github_search_tool.py) | Agent 5 | Calls the public GitHub search API, sanitizes descriptions against prompt-injection patterns, caches results in-process. |

#### LLM configuration

All agents use the model in `GEMINI_MODEL` (set in [config.py](../backend/app/core/config.py)) through LiteLLM. Temperatures are kept at `0.0` for analysis agents (1, 2, 3, 4) and `0.2` for the synthesis agents (5, 6, 7). Agents 5, 6, 7 also enable Gemini's `thinking` budget (`2048` / `1024` tokens) to improve reasoning depth without bloating final outputs.

#### Self-healing retry

`crew.kickoff()` is wrapped in a `max_attempts=5` loop that:

1. Catches `RESOURCE_EXHAUSTED`/`429`/`RateLimitError` and backs off `65 × attempt` seconds.
2. On any retry path, saves whatever Agent 1 and Agent 2 *did* manage to produce into the per-agent caches, so the next attempt can skip them entirely.
3. Re-raises non-rate-limit errors and returns a structured `{"error": ..., "note": ...}` after exhausting attempts — the orchestrator (B2) propagates this as a `failed` job.

### B4 — Determinism Layer

LLMs produce different numbers run-to-run. The pipeline therefore treats LLM output as **judgment** (skill identification, alias resolution, gap selection) and re-derives every number in Python.

#### Per-agent caches

| Cache | Module | Keyed on | Effect |
|---|---|---|---|
| GitHub skills | [github_skill_cache.py](../backend/app/ai/cache/github_skill_cache.py) | `SHA-256(github_block)` per student | On hit, Agent 1's output is injected into `github_task.output.raw` and Agent 1 is dropped from the crew. |
| Academic skills | `academic_skill_cache.py` | `SHA-256(academic_block)` per student | Same pattern for Agent 2. |

Combined effect: a re-run with unchanged GitHub or unchanged grades pays at most for Agents 3–7, eliminating the two highest-variance, highest-token agents on the happy path.

#### Pseudonymization & PII redaction

[pseudonymizer.py](../backend/app/core/pseudonymizer.py) is the single chokepoint:

```
safe_student_data = pseudonymize_student_data(student_data)
# every identifier (sr_code, full_name, email, github_username, repo owners)
# is replaced with HMAC-SHA256(PSEUDONYM_KEY, "<namespace>:<value>")[:12]
```

After the crew, `redact_pii(raw_output, original_student_data)` scrubs the raw LLM outputs as defense-in-depth in case any cleartext PII leaked back via prompt-injection echoes or model memorization. Only after redaction is the JSON parsed.

#### Deterministic re-scoring (`scoring.py`)

[scoring.py](../backend/app/ai/scoring.py) is invoked in `_parse_combined_output`:

| Function | What it does |
|---|---|
| `canonicalize(skill)` | Lowercases and dealiases (`js → javascript`, `k8s → kubernetes`, …). |
| `recompute_unified_skills(raw_unified)` | Applies the 60/40 academic/github fusion (100/0 for hardware skills missing from GitHub), re-derives `status` bands and `skill_summary` counters from the fused scores. |
| `recompute_career_matches(matches, unified)` | Keeps the LLM's `matched_skills` / `gap_skills` judgments but recomputes `match_score` in Python, capped at 95 (no perfect 100), with a GitHub-presence bonus of 5. |

The pipeline_service then layers two more guards on top:

- **`_ensure_all_careers_present`** — fills in any career the LLM dropped using `evaluate_career_skills` + `compute_match_score`, so every catalog career has a stable score even if Gemini decides to omit it.
- **Non-decreasing match scores** — for every career also present in the previous report, `match_score = max(new, previous)`. Match scores never go backward across runs.

#### Per-career recommendations

`_enrich_all_careers_with_recommendations` walks every `career_match` that has `gap_skills` but no `career_recommendations`, then for each gap skill queries `knowledge_chunks` (categories `gap_closer`, `resources`) for the first matching chunk and emits a one-line "Skill: summary" recommendation. Capped at 6 per career. If the knowledge base has no match, a deterministic action item is synthesized from the skill name and career title.

### B5 — Persistence Layer

| Table | Model | Role |
|---|---|---|
| `pipeline_jobs` | [PipelineJob](../backend/app/models/pipeline_models.py) | Per-run state machine row (`pending → running → completed/failed`). |
| `career_reports` | [CareerReport](../backend/app/models/pipeline_models.py) | Persisted result (`report_json`, `summary`, `progression_json`, `chosen_career`). |
| `github_skill_cache` | [github_skill_cache.py](../backend/app/models/github_skill_cache.py) | Hash-keyed Agent 1 output. |
| `academic_skill_cache` | [academic_skill_cache.py](../backend/app/models/academic_skill_cache.py) | Hash-keyed Agent 2 output. |
| `knowledge_chunks` | [knowledge.py](../backend/app/models/knowledge.py) | RAG corpus (career paths, gap_closer, resources, curriculum, ILO definitions). pgvector embeddings, queried via `<=>` cosine distance. |
| `users`, `classes`, `assessments`, `assessment_ilos`, `student_scores`, `github_profile`, `repository_cache`, `contribution_cache` | various | Source-of-truth tables read by `_fetch_student_data`. |

Read helpers live in [pipeline_repository.py](../backend/app/repositories/pipeline_repository.py):

- `get_previous_report(student_id)` — most-recent non-empty report (basis for Agent 7 diff and the score-floor guard).
- `get_latest_report(student_id)` / `get_latest_completed_report(student_id)` — used by `/pipeline/report` and by [roadmap_service.py](../backend/app/services/roadmap_service.py) to overlay skill data on roadmap nodes.

The `User` table is the persistent home for `chosen_career`, which is mirrored into every `CareerReport` row at write time so historical reports remember which career the student was targeting at the time.

### B6 — Activity & Artifact Layer

After a successful run, the orchestrator emits two kinds of side-effects:

1. **Activity feed events** — via [activity_service.py](../backend/app/services/activity_service.py):
   - `emit_career_updated(student_id, career_name)` — always.
   - `emit_skill_milestone(student_id, skill, level)` for every skill that newly crossed `MILESTONE_THRESHOLD = 80` since the previous run. Cap of 3 emissions per run (`MILESTONE_MAX_PER_RUN`), sorted by score descending. First-time runs emit none.

2. **Markdown artifact** — `write_markdown_report_to_artifacts` writes `/home/humunculey/ASPIRE/artifacts/student_career_reports/{full_name}_career_report.md` containing the full executive summary, career compatibility table, skill profile, gap analysis, prioritized academic subjects, and progression block. Artifact generation is wrapped in a `try/except` so artifact failures never fail the pipeline.

### B7 — Read Path

Once the job completes, the frontend's read path is straightforward:

- **`GET /pipeline/status/{job_id}`** — returns the `PipelineJob` row. Polled at 3 s by the frontend ([usePipeline.js](../frontend/src/features/student/dashboard/hooks/usePipeline.js)).
- **`GET /pipeline/report/{student_id}`** — returns the latest `CareerReport` with `report_json` parsed back to an object and `Cache-Control: no-store` so refresh always reflects the newest run.
- **`GET /api/student/predictions`** — orthogonal read path used by the dashboard. Served by [ml_service.py](../backend/app/services/ml_service.py): the trained scikit-learn pipeline at `backend/ml/artifacts/skill_pipeline.joblib` blends ILO percentages (70%) with per-course skill predictions (30%) and projects them onto 13 Student Outcomes via `compute_so_scores`. These predictions are **not** consumed by the AI crew — they feed the dashboard's ILO Coverage and skill-aggregation widgets, and they are merged into the frontend's per-skill proficiency lookup by [useCareerCoach.js](../frontend/src/features/student/career-coach/hooks/useCareerCoach.js).

---

## 4. ML sub-pipeline (off-path)

Although the AI crew is the dominant pipeline, ASPIRE also runs a classical-ML sub-pipeline that is invoked synchronously per student request (no job state, no caching beyond the in-process singleton).

```
GET /api/student/predictions
        │
        ▼
ml_service.predict_student_aggregate(scores_by_course)
        │
        ▼
ml.predictor.SkillsPredictor.predict(course, ilo1..4, semester)
        │  (joblib pipeline: skill_pipeline.joblib)
        ▼
blend: skill_score = 0.7 × ilo_avg + 0.3 × predicted
        │
        ▼
per-course → aggregated_skills (max across courses, accumulation rule)
        │
        ▼
compute_so_scores(aggregated)  → SO1..SO13
```

Notes:

- `COURSE_PROFILES` masks predictions to skills the course is actually designed to develop (weight 0 → predicted skill suppressed to 0). Prevents nonsensical cross-mappings (e.g., Drawing → Microprocessors).
- Skill aggregation uses `max(values)` across courses rather than `mean` so mastery in one course isn't diluted by lower scores in another course that maps to the same skill.
- The ML model is loaded once per process as a module-level singleton (`_predictor`).

---

## 5. Cross-cutting properties

- **Single chokepoint for PII** — every AI-bound identifier passes through `pseudonymize_student_data`; everything leaving the LLM passes through `redact_pii`. The rest of the system uses cleartext.
- **HMAC-keyed deterministic cache key** — `_compute_input_hash` is keyed by `SECRET_KEY` so cross-deployment replays are impossible.
- **Per-agent caches survive failure** — even on a crashed crew, Agent 1 and Agent 2 outputs are written to their caches, so the next attempt is materially cheaper.
- **Deterministic numbers, judgmental words** — LLMs choose skills and write prose; Python computes scores, statuses, and counters. Same input → same output.
- **Score monotonicity** — match scores cannot decrease across runs (`new = max(new, previous)`); skill milestones fire only on first crossing of the 80% threshold.
- **Tenant safety** — every endpoint enforces `current_user.id == student_id`; in-memory task registry is keyed by `student_id`; 10-minute orphan auto-fail prevents deadlock across restarts.
- **Defense against prompt injection** — `github_search` strips `ignore (previous|all|above|your)`, `disregard`, `override`, `system prompt`, `forget your instructions`, `you are now`, `act as`, `roleplay as`, `jailbreak`, and `<|im_start|>`/`<|im_end|>` from any returned description, then caps at 300 chars before exposing it to the LLM.
- **Graceful degradation** — RAG misses fall back to deterministic action items; missing careers are filled with `evaluate_career_skills`-derived scores; artifact write failures don't fail the job; ML prediction is null-safe for unscored courses.

---

## 6. File index

HTTP / orchestration:
- [pipeline_routes.py](../backend/app/api/pipeline_routes.py)
- [pipeline_service.py](../backend/app/services/pipeline_service.py)
- [pipeline_repository.py](../backend/app/repositories/pipeline_repository.py)
- [pipeline_models.py](../backend/app/models/pipeline_models.py)

AI crew & agents:
- [crew.py](../backend/app/ai/crew.py)
- [github_agent.py](../backend/app/ai/agents/github_agent.py)
- [academic_agent.py](../backend/app/ai/agents/academic_agent.py)
- [skill_agent.py](../backend/app/ai/agents/skill_agent.py)
- [career_agent.py](../backend/app/ai/agents/career_agent.py)
- [gap_agent.py](../backend/app/ai/agents/gap_agent.py)
- [report_agent.py](../backend/app/ai/agents/report_agent.py)
- [progress_tracker_agent.py](../backend/app/ai/agents/progress_tracker_agent.py)

Tools:
- [student_data_tool.py](../backend/app/ai/tools/student_data_tool.py)
- [rag_career_tool.py](../backend/app/ai/tools/rag_career_tool.py)
- [github_search_tool.py](../backend/app/ai/tools/github_search_tool.py)

Determinism & caching:
- [scoring.py](../backend/app/ai/scoring.py)
- [github_skill_cache.py](../backend/app/ai/cache/github_skill_cache.py)
- [academic_skill_cache.py](../backend/app/ai/cache/academic_skill_cache.py)
- [pseudonymizer.py](../backend/app/core/pseudonymizer.py)

Career catalog & subject mapping:
- [career_catalog.py](../backend/app/services/career_catalog.py)
- [subject_skill_map.py](../backend/app/ai/data/subject_skill_map.py)

ML sub-pipeline:
- [ml_service.py](../backend/app/services/ml_service.py)
- [predictor.py](../backend/ml/predictor.py)
- [targets.py](../backend/ml/config/targets.py)

Supporting services:
- [activity_service.py](../backend/app/services/activity_service.py)
- [roadmap_service.py](../backend/app/services/roadmap_service.py)
- [github_service.py](../backend/app/services/github_service.py)
