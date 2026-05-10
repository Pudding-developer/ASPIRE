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
import hashlib
import json
import logging
import time
import uuid

from crewai import Crew, Process
from litellm.exceptions import RateLimitError as LiteLLMRateLimitError
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from app.ai.tools.student_data_tool import StudentDataTool
from app.ai.tools.rag_career_tool import RAGCareerTool
from app.ai.tools.github_search_tool import GitHubSearchTool

from app.ai.agents.github_agent import create_github_analyzer, create_github_analysis_task
from app.ai.agents.academic_agent import create_academic_analyzer, create_academic_analysis_task
from app.ai.agents.skill_agent import create_skill_synthesizer, create_skill_synthesis_task
from app.ai.agents.career_agent import create_career_mapper, create_career_mapping_task
from app.ai.agents.gap_agent import create_gap_analyst, create_gap_analysis_task
from app.ai.agents.report_agent import create_report_generator, create_report_generation_task
from app.ai.agents.progress_tracker_agent import create_progress_tracker, create_progress_tracking_task

logger = logging.getLogger(__name__)


def _run_with_retry(crew: Crew, inputs: dict, max_attempts: int = 5):
    """
    Executes crew kickoff with exponential-backoff retry on 429 rate-limit errors.

    Vertex AI free-tier quotas are per-minute. If the pipeline is long enough
    to exhaust the RPM budget, we wait for the window to reset (60–120 s) and
    retry the entire crew from the beginning rather than crashing the job.
    """
    for attempt in range(1, max_attempts + 1):
        try:
            return crew.kickoff(inputs=inputs)
        except Exception as e:
            err_str = str(e)
            is_rate_limit = (
                "RESOURCE_EXHAUSTED" in err_str
                or "RateLimitError" in err_str
                or "429" in err_str
            )
            if is_rate_limit and attempt < max_attempts:
                wait_secs = 65 * attempt  # 65 s → 130 s → give up
                print(f"\n[crew] Rate-limit hit on attempt {attempt}/{max_attempts}. "
                      f"Waiting {wait_secs}s before retry...\n")
                time.sleep(wait_secs)
                continue
            raise  # re-raise on non-rate-limit errors or final attempt


import re

def _parse_json(raw: str) -> dict:
    """Robust JSON parsing that strips markdown code blocks and surrounding text."""
    raw = raw.strip()
    # Try to find a JSON block enclosed in markdown backticks
    match = re.search(r'```(?:json)?\s*(.*?)\s*```', raw, re.DOTALL)
    if match:
        raw = match.group(1).strip()
    
    # If no backticks, or after extracting, try to find the first { and last }
    start_idx = raw.find('{')
    end_idx = raw.rfind('}')
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        raw = raw[start_idx:end_idx+1]
        
    return json.loads(raw)


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
    # ── Instantiate shared tools ──────────────────────────────────────────────
    student_data_tool = StudentDataTool()
    student_data_tool.set_data(student_data)

    rag_career_tool = RAGCareerTool()
    github_search_tool = GitHubSearchTool()

    # ── GitHub Skill Cache check ───────────────────────────────────────────────
    # If student_id + sync_db were passed and the GitHub data hasn't changed
    # since the last run, reuse Agent 1's cached output and skip re-extraction.
    _cached_github_output: str | None = None
    _github_data_hash: str | None = None
    _use_cached_github = False

    if student_id and sync_db is not None:
        try:
            from app.ai.cache.github_skill_cache import hash_github_data, get_cached_github_skills
            github_block = student_data.get("github_profile", {})
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

    # ── Inject deterministic subject mappings into Agent 2 ───────────────
    academic_task.description = academic_task.description.replace(
        "{subject_skill_context}",
        subject_skill_context
    )

    # ── Assemble crew ─────────────────────────────────────────────────────────
    crew = Crew(
        agents=[
            github_analyzer,
            academic_analyzer,
            skill_synthesizer,
            career_mapper,
            gap_analyst,
            report_generator,
            progress_tracker,
        ],
        tasks=[
            github_task,
            academic_task,
            skill_task,
            career_task,
            gap_task,
            report_task,
            progress_task,
        ],
        process=Process.sequential,
        verbose=True,
        max_rpm=30,  # bumped from 15 — gemini-2.5-flash has no explicit RPM cap on this project
    )

    # ── Pseudonymize identifiers before they reach Vertex AI ────────────────
    # Real names and SR codes are direct PII under RA 10173. The LLM has no
    # analytical need for them — all real data comes through student_data_tool.
    # A per-session opaque token is used instead so retry logs can be
    # correlated without exposing the student's identity.
    _session_token = uuid.uuid4().hex[:8]
    _raw_sr = student_data.get("sr_code") or ""
    _pseudo_sr = (
        hashlib.sha256(_raw_sr.encode()).hexdigest()[:12]
        if _raw_sr else "unknown"
    )

    try:
        result = _run_with_retry(crew, inputs={
            "student_name": f"Student-{_session_token}",
            "sr_code":      _pseudo_sr,
            "previous_report_json": previous_report or "null",
            "subject_skill_context": subject_skill_context,
        })
    except Exception as e:
        import traceback
        print(f"\n{'='*60}")
        print(f"CREW PIPELINE FAILED: {e}")
        traceback.print_exc()
        print(f"{'='*60}\n")
        return {
            "error": f"AI Pipeline execution failed: {str(e)}",
            "note": "The crew failed to complete the analysis tasks."
        }

    # ── Save fresh Agent 1 output to cache (only on cache miss) ───────────────
    if not _use_cached_github and student_id and sync_db is not None and _github_data_hash:
        try:
            from app.ai.cache.github_skill_cache import save_github_skills
            if hasattr(result, 'tasks_output') and len(result.tasks_output) >= 1:
                raw_github = result.tasks_output[0].raw or ""
                try:
                    skills_dict = _parse_json(raw_github)
                    save_github_skills(student_id, _github_data_hash, skills_dict, sync_db)
                except (json.JSONDecodeError, Exception) as parse_err:
                    logger.warning("[crew] Could not parse Agent 1 output for cache: %s", parse_err)
                    with open('/tmp/err.log', 'a') as f:
                        f.write(f"Parse error: {parse_err}\nRaw output was: {raw_github}\n")
        except Exception as exc:
            logger.warning("[crew] Cache save failed: %s — continuing without cache", exc)

    # Extract raw outputs from the result object
    report_raw = ""
    progress_raw = ""

    if hasattr(result, 'tasks_output') and len(result.tasks_output) >= 7:
        report_raw = result.tasks_output[5].raw
        progress_raw = result.tasks_output[6].raw
    else:
        # Fallback if task structure changed
        progress_raw = result.raw if hasattr(result, "raw") else str(result)

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
    from app.ai.scoring import recompute_career_matches

    # Define required keys for validation
    report_keys = [
        "career_matches", "recommendations", "summary",
        "skill_profile", "gap_analysis"
    ]
    # We validate a minimal set for progress to allow for variations between agent versions
    progress_keys = ["readiness_score_change", "summary"]

    report_dict = _parse_json_snippet(report_raw, required_keys=report_keys)
    progress_dict = _parse_json_snippet(progress_raw, required_keys=progress_keys)

    # Deterministic re-scoring: use the matched/gap skill lists the LLM
    # produced (its judgment is fine), but compute the match_score in Python.
    # This eliminates the ±15-50pt variance from LLM arithmetic + alias
    # resolution on identical inputs.
    skill_profile = report_dict.get("skill_profile", {}) or {}
    unified_skills = skill_profile.get("unified_skills", []) or []
    rescored = recompute_career_matches(
        report_dict.get("career_matches", []) or [],
        unified_skills,
    )

    # Sync the progress block to the new top score so it's consistent.
    if rescored:
        progress_dict["career_readiness_score"] = rescored[0].get("match_score", 0)
        prev = progress_dict.get("previous_readiness_score", 0) or 0
        progress_dict["readiness_change"] = (
            progress_dict["career_readiness_score"] - prev if prev else 0
        )

    return {
        "career_matches":  rescored,
        "recommendations": report_dict.get("recommendations", []),
        "summary":         report_dict.get("summary", ""),
        "skill_profile":   skill_profile,
        "gap_analysis":    report_dict.get("gap_analysis", []),
        "progress":        progress_dict,
    }


def _parse_json_snippet(raw: str, required_keys: list = None) -> dict:
    """
    Robustly extracts JSON from LLM output.
    1. Tries direct json.loads()
    2. Tries regex extraction between { and }
    3. Validates required keys
    4. Raises ValueError if all fails
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

