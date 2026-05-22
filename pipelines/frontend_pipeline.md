# ASPIRE — End-to-End Frontend Pipeline

This document describes the **end-to-end frontend pipeline** of the ASPIRE web client: the path a student-initiated action travels from the rendered UI, through orchestration hooks, REST adapters, and the asynchronous backend job, back into a fully derived Career Coach interface.

The pipeline is layered into six structural tiers (L1–L6). Each tier has a single responsibility, communicates downward by function call and upward by React state, and is independently testable.

---

## 1. Overview

ASPIRE's frontend is a Vite + React single-page application. The Career Coach feature is the most pipeline-heavy surface in the system: a single user click ("Refresh Analysis") triggers a multi-agent backend AI workflow that may run for tens of seconds, and whose result is consumed by ~10 downstream visualizations. The frontend therefore acts as both:

1. **An asynchronous job controller** — submits a pipeline job, polls its status, classifies its terminal outcome, and surfaces progress/result UI.
2. **A pure derivation layer** — once a final report is available, it is normalized into UI-ready data structures (`careerMatches`, `skills`, `gaps`, `insights`) through memoized pure functions.

The full data flow is summarized in Figure 1.

### Figure 1 — Layered architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  L1 — Presentation Layer (Views & Components)                        │
│       StudentCareerView · CareerPathCard · RoadmapViewer ·           │
│       PipelineResultModal · AnalysisLoadingCard · CareerPicker       │
└──────────────────────────────────────────────────────────────────────┘
                      │  user intent (click "Refresh Analysis")
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  L2 — Orchestration Layer (Custom Hooks)                             │
│       useCareerCoach  ──►  usePipeline  ──►  useStudentData          │
│       (derivations)        (job lifecycle)  (profile / predictions)  │
└──────────────────────────────────────────────────────────────────────┘
                      │  pipelineApi.run(studentId, {force})
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  L3 — Service Layer (Typed REST Adapters)                            │
│       pipelineApi · studentService · roadmapService                  │
└──────────────────────────────────────────────────────────────────────┘
                      │  request(method, path, body)
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  L4 — Transport Layer (api.js)                                       │
│       fetch wrapper · JWT injection · X-Refresh-Token rotation       │
│       error normalization · AbortController support                  │
└──────────────────────────────────────────────────────────────────────┘
                      │  HTTPS / JSON
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  L5 — Asynchronous Job Loop                                          │
│       setInterval(3 s)  ──►  pipelineApi.getStatus(jobId)            │
│       terminal states: completed · failed · no_change                │
└──────────────────────────────────────────────────────────────────────┘
                      │  status updates · final report
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  L6 — Derivation & Render Layer                                      │
│       buildSkills · buildGaps · buildStaticGaps · deriveInsights     │
│       → React re-render of L1 components                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-end sequence

The canonical sequence for a "Refresh Analysis" interaction is:

```
User                View              Hook              Service          Transport        Backend
 │                   │                  │                  │                 │               │
 │ click "Refresh"   │                  │                  │                 │               │
 ├──────────────────►│ runPipeline()    │                  │                 │               │
 │                   ├─────────────────►│ pipelineApi.run  │                 │               │
 │                   │                  ├─────────────────►│ request(POST..) │               │
 │                   │                  │                  ├────────────────►│ POST /run/:id │
 │                   │                  │                  │                 ├──────────────►│
 │                   │                  │                  │                 │   { job_id }  │
 │                   │                  │◄─────────────────┴─────────────────┴───────────────┤
 │                   │                  │ setJobId / start setInterval(3s)                   │
 │                   │                  │                                                    │
 │                   │                  │ ── every 3s ──► getStatus(jobId) ──► GET /status   │
 │                   │ pipelineStatus   │◄────────────── job (percentage, current_step) ────┤
 │                   │ progress UI      │                                                    │
 │                   │                  │ when status ∈ {completed, failed}:                 │
 │                   │                  │   clearInterval; classify pipelineResult;          │
 │                   │                  │   fetchReports() ──► getReport(:id) ──► GET /report│
 │                   │ re-render        │◄──────────────────── final report ──────────────── │
 │                   │ (cards, donut,   │                                                    │
 │                   │  roadmap, etc.)  │                                                    │
```

Three terminal outcomes are distinguished:

| Outcome      | Trigger                                                                                  | UI surface                                    |
|--------------|------------------------------------------------------------------------------------------|-----------------------------------------------|
| `success`    | Backend `status === 'completed'` and a new report was produced                            | `PipelineResultModal` (success variant) + full re-render |
| `no_change`  | Backend `status === 'completed'` and `current_step === 'No new data — returning previous report'` | `PipelineResultModal` (no-change variant) with "Run Anyway" → `runPipeline({force:true})` |
| `error`      | Backend `status === 'failed'` or transport-level exception (network/abort)               | `PipelineResultModal` (error variant) + toast |

---

## 3. Layer-by-layer

### L1 — Presentation Layer

The entry point for the pipeline is [StudentCareerView.jsx](../frontend/src/features/student/career-coach/views/StudentCareerView.jsx), which composes nine child components. No component in this layer issues network calls directly; all I/O is mediated by hooks.

Key components:

| Component | File | Role |
|---|---|---|
| `StudentCareerView` | [StudentCareerView.jsx](../frontend/src/features/student/career-coach/views/StudentCareerView.jsx) | Top-level orchestrator; renders header, tabs, cards, roadmap, modals, and toasts. |
| `CareerPicker` | [CareerPicker.jsx](../frontend/src/features/student/career-coach/components/CareerPicker.jsx) | First-run experience: selects an initial chosen career and triggers the very first pipeline run. |
| `CareerEmptyState` | [CareerEmptyState.jsx](../frontend/src/features/student/career-coach/components/CareerEmptyState.jsx) | Shown while the very first pipeline job is running and no report yet exists. |
| `CareerPathCard` | [CareerPathCard.jsx](../frontend/src/features/student/career-coach/components/CareerPathCard.jsx) | One card per pinned career, supports both "analyzed" and "unanalyzed/stub" rendering. |
| `CareerMatchDonut` | [CareerMatchDonut.jsx](../frontend/src/features/student/career-coach/components/CareerMatchDonut.jsx) | Visualizes `match_score` for the selected path. |
| `RoadmapViewer` | [RoadmapViewer.jsx](../frontend/src/features/student/career-coach/components/RoadmapViewer.jsx) | Renders the per-career learning roadmap fetched via `roadmapService`. |
| `AnalysisLoadingCard` | [AnalysisLoadingCard.jsx](../frontend/src/features/student/career-coach/components/AnalysisLoadingCard.jsx) | Full-screen progress overlay during a pipeline run, with cancel affordance. |
| `PipelineResultModal` | [PipelineResultModal.jsx](../frontend/src/features/student/career-coach/components/PipelineResultModal.jsx) | Terminal-state modal: success / no_change / error. |
| `CareerAllPathsModal` | [CareerAllPathsModal.jsx](../frontend/src/features/student/career-coach/components/CareerAllPathsModal.jsx) | Catalog browser for pinning/unpinning careers. |

### L2 — Orchestration Layer (Custom Hooks)

State and side-effects are encapsulated in three composable hooks forming a dependency chain:

| Hook | File | Responsibility |
|---|---|---|
| `useCareerCoach` | [useCareerCoach.js](../frontend/src/features/student/career-coach/hooks/useCareerCoach.js) | Memoized derivation of `careerMatches`, `skills`, `gaps`, `insights`, `activeTitle`; reconciles AI-scored careers with locally pinned ones; persists pinned-card state to `localStorage`. |
| `usePipeline` | [usePipeline.js](../frontend/src/features/student/dashboard/hooks/usePipeline.js) | Owns the pipeline job lifecycle (`jobId`, `pipelineStatus`, `pipelineResult`); manages the 3 s polling interval and result classification. |
| `useStudentData` | [useStudentData.js](../frontend/src/features/student/dashboard/hooks/useStudentData.js) | Parallel fetch of profile, classes, scores, and ML predictions via `Promise.allSettled`; derives ILO coverage from Student-Outcome scores. |
| `useRoadmap` | [useRoadmap.js](../frontend/src/features/student/career-coach/hooks/useRoadmap.js) | Fetches the per-career roadmap whenever `careerTitle` changes. |

`useCareerCoach` composes `usePipeline` and `useStudentData`, exposing a single fan-out interface that the view consumes. This layering allows the view to remain stateless with respect to network concerns and enables the same pipeline state machine to be reused across the Dashboard and the Career Coach surface.

### L3 — Service Layer

REST endpoints are exposed as method namespaces. Each method is a one-line adapter that fixes HTTP verb, path, and request shape — hooks never construct URLs directly.

Pipeline interface ([pipelineApi.js](../frontend/src/services/pipelineApi.js)):

```js
pipelineApi.run(studentId, {force})    → POST /api/pipeline/run/{id}[?force=true]
pipelineApi.getStatus(jobId)           → GET  /api/pipeline/status/{jobId}
pipelineApi.cancel(studentId)          → POST /api/pipeline/cancel/{id}
pipelineApi.getReport(studentId)       → GET  /api/pipeline/report/{id}
pipelineApi.getAllReports(studentId)   → GET  /api/pipeline/reports/{id}
```

Adjacent services used by the same flow:

- [studentService.js](../frontend/src/services/studentService.js) — profile, classes, scores, predictions, careers catalog, chosen career.
- [roadmapService.js](../frontend/src/services/roadmapService.js) — per-career learning roadmap.

### L4 — Transport Layer

All service methods funnel through a single `request()` helper in [api.js](../frontend/src/services/api.js). The wrapper performs four cross-cutting concerns:

1. **Base-URL resolution** via `import.meta.env.VITE_API_URL` (default `http://localhost:8000`).
2. **Bearer-token injection** from `localStorage['aspire_token']`.
3. **Opportunistic JWT rotation** by reading the `X-Refresh-Token` response header and writing it back to `localStorage`.
4. **Uniform error surfacing** — non-OK responses are converted to `Error` objects carrying the server's `detail` payload, enabling downstream error classifiers (e.g. `friendlyPipelineError` in `StudentCareerView`) to map raw exceptions to actionable user messages.

`AbortController` signals can be threaded through the `options.signal` parameter to make any request cancellable.

### L5 — Asynchronous Job Loop

Because backend analysis is long-running (multi-agent AI crew over GitHub and academic data), the frontend implements a polling state machine inside `usePipeline.runPipeline`:

```
                  ┌──────────────┐
   click          │              │  POST /pipeline/run
   "Refresh" ────►│   idle       ├────────────────────────┐
                  │              │                        ▼
                  └──────────────┘                ┌──────────────┐
                          ▲                       │  starting    │
       cancel /           │                       │  (job_id=?)  │
       unmount            │                       └──────┬───────┘
          ┌───────────────┘                              │ job_id assigned
          │                                              ▼
          │       ┌──────────────┐  GET /status   ┌──────────────┐
          ├───────│  no_change   │◄───────────────│  polling     │
          │       └──────────────┘ status=completed└──────┬───────┘
          │       ┌──────────────┐  +cache hit          │
          ├───────│  success     │◄─────────────────────┤
          │       └──────────────┘ status=completed     │
          │       ┌──────────────┐                      │
          └───────│  error       │◄─────────────────────┘
                  └──────────────┘ status=failed | network err
```

Step-by-step:

1. **Submission** — `POST /pipeline/run/{id}` returns a `job_id`; the hook records it and sets `pipelineStatus = {status: 'starting', percentage: 0}`.
2. **Polling** — a `setInterval` ticks every 3000 ms calling `getStatus(jobId)` and writing the raw job object into `pipelineStatus`, so the view can render `current_step` and `percentage` in real time.
3. **Termination** — when `status ∈ {completed, failed}` the interval is cleared and a `pipelineResult` is emitted:
   - `outcome: 'success'` for a fresh report;
   - `outcome: 'no_change'` if the backend signals an input-hash cache hit (`current_step === 'No new data — returning previous report'`);
   - `outcome: 'error'` for backend failures or transport-level exceptions.
4. **Re-hydration** — on `completed`, `fetchReports()` re-fetches the latest report and triggers L6 derivation.
5. **Cleanup** — `useEffect`'s teardown clears any active interval on unmount, preventing zombie polling.
6. **Cancellation** — `cancelPipeline` calls `POST /pipeline/cancel/{id}`, clears the polling interval, and resets local state.

This separation between **status polling** (transient progress) and **result classification** (terminal outcome) decouples progress UI (`AnalysisLoadingCard`) from completion UX (`PipelineResultModal`).

### L6 — Derivation & Render Layer

Once a report arrives, raw backend output is normalized into UI-ready structures by pure functions in [useCareerCoach.js](../frontend/src/features/student/career-coach/hooks/useCareerCoach.js):

| Function | Input | Output |
|---|---|---|
| `buildSkills(match, profile, aggregated)` | A career match + skill profile + ML-aggregated skill scores | Ranked `{name, percentage, status}` list with `strong`/`developing` classification. |
| `buildGaps(match, profile, aggregated)` | Same | Top-6 gap list with `acquired`/`developing`/`critical` classification. |
| `buildStaticGaps(title, profile, aggregated, careerOptions)` | A pinned but un-analyzed career | Synthesized gap list using the static career catalog as the required-skill set. |
| `deriveInsights(match, isOptimal)` | A match + optimality flag | Three-class insight list (`pos`/`tip`/`warn`) rendered in the Insights tab. |
| `lookupProficiency(name, profile)` | Skill name + skill profile | Normalized 0–100 proficiency from `unified_skills` or legacy `technical_skills`/`programming_languages` lists. |

A defensive `skillName()` coerces heterogeneous backend shapes (`string` vs `{name, priority}`) to plain strings, preventing the derivation layer from crashing on schema drift. Memoization (`useMemo`) guarantees that derivations only recompute when their dependencies change, keeping the render path O(1) under steady state.

Derived state exposed to the view:

```
pipelineData       — raw report.report
careerMatches      — pipelineData.career_matches filtered to live catalog
skillProfile       — pipelineData.skill_profile
recommendations    — pipelineData.recommendations
summary            — pipelineData.summary
selectedPath       — careerMatches[selectedIndex]
optimalIndex       — index of highest-scoring pinned career
activeTitle        — resolved active career title (see § 4)
skills             — buildSkills(selectedPath, …)
gaps               — buildGaps(selectedPath, …) or buildStaticGaps(...)
insights           — deriveInsights(selectedPath, isOptimal)
```

---

## 4. Active-title resolution

Because pinned careers can be analyzed *or* unanalyzed, and because the AI can rename/remove careers between runs, the "currently selected career" is resolved by a small algorithm rather than by array index:

```
visibleArr = pinned ∩ catalog

if selectedCareerTitle is set AND still in visibleArr:
    activeTitle = selectedCareerTitle
elif any pinned career has an AI match:
    activeTitle = highest-scoring pinned match
elif chosenCareer is pinned:
    activeTitle = chosenCareer
else:
    activeTitle = visibleArr[0]
```

Selection is keyed by **title** (not index), so user selection survives pipeline refreshes, catalog renames, and pinning/unpinning of un-analyzed careers.

---

## 5. State persistence

| State | Where | Key | Notes |
|---|---|---|---|
| JWT token | `localStorage` | `aspire_token` | Rotated opportunistically via `X-Refresh-Token`. |
| Pinned careers | `localStorage` | `aspire_visible_careers_{userId}` | Mirrored to a `Set`, reconciled against catalog on load. |
| Chosen career | Backend | `/api/student/career` | Authoritative; broadcast intra-tab via `CustomEvent('aspire_career_chosen')`. |
| Pipeline job | Backend | `/api/pipeline/status/{jobId}` | Frontend holds only `jobId` + polled status; no result is kept beyond the report. |

---

## 6. Cross-cutting properties

- **Idempotent caching** — the `force` flag threaded `view → hook → service` lets users bypass the backend's input-hash cache from the "Run Anyway" CTA in the no-change modal.
- **Selection survival** — title-keyed (not index-keyed) selection survives every refresh path.
- **Catalog reconciliation** — pinned titles are filtered against the live catalog on every load and on every catalog refresh, dropping stale titles silently.
- **Error containment** — each layer narrows responsibility: transport returns `Error`, hooks classify outcomes, view layer applies user-facing copy (`friendlyPipelineError` maps `RESOURCE_EXHAUSTED`, `429`, `BILLING_DISABLED`, `VertexAIException`, network errors → student-facing strings).
- **Cancel safety** — unmount, navigation, and explicit cancel all converge on the same teardown path (clear interval, drop `jobId`, server cancel).
- **Pure derivations** — all UI-ready data is a pure function of `(report, profile, predictions, pinnedTitles, selectedTitle)`, making the view deterministic with respect to upstream state.

---

## 7. File index

Presentation layer:
- [StudentCareerView.jsx](../frontend/src/features/student/career-coach/views/StudentCareerView.jsx)
- [CareerPathCard.jsx](../frontend/src/features/student/career-coach/components/CareerPathCard.jsx)
- [CareerMatchDonut.jsx](../frontend/src/features/student/career-coach/components/CareerMatchDonut.jsx)
- [CareerPicker.jsx](../frontend/src/features/student/career-coach/components/CareerPicker.jsx)
- [CareerEmptyState.jsx](../frontend/src/features/student/career-coach/components/CareerEmptyState.jsx)
- [CareerAllPathsModal.jsx](../frontend/src/features/student/career-coach/components/CareerAllPathsModal.jsx)
- [RoadmapViewer.jsx](../frontend/src/features/student/career-coach/components/RoadmapViewer.jsx)
- [AnalysisLoadingCard.jsx](../frontend/src/features/student/career-coach/components/AnalysisLoadingCard.jsx)
- [PipelineResultModal.jsx](../frontend/src/features/student/career-coach/components/PipelineResultModal.jsx)

Orchestration layer:
- [useCareerCoach.js](../frontend/src/features/student/career-coach/hooks/useCareerCoach.js)
- [usePipeline.js](../frontend/src/features/student/dashboard/hooks/usePipeline.js)
- [useStudentData.js](../frontend/src/features/student/dashboard/hooks/useStudentData.js)
- [useRoadmap.js](../frontend/src/features/student/career-coach/hooks/useRoadmap.js)

Service & transport layer:
- [pipelineApi.js](../frontend/src/services/pipelineApi.js)
- [studentService.js](../frontend/src/services/studentService.js)
- [roadmapService.js](../frontend/src/services/roadmapService.js)
- [api.js](../frontend/src/services/api.js)
