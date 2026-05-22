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
    # ── Pseudonymize the full student_data dict once, up front ──────────────
    # Every downstream surface that hands data to the LLM (StudentDataTool,
    # prompt template inputs, logs) receives the pseudonymized copy only.
    # The original `student_data` is retained in this scope solely for the
    # output-side redactor at the bottom of this function.
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
    # Defense-in-depth: scrub any cleartext PII that may have leaked back
    # via prompt-injection echoes or model memorization before parsing or
    # persisting the report.
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

    # Deterministic re-scoring of Agent 3 (Skill Synthesizer): the LLM still
    # does skill identification, alias resolution, and raw academic/github
    # score extraction, but we apply the 60/40 fusion (with 100/0 fallback
    # for hardware skills missing from GitHub) and re-derive the status
    # bands + summary counts in pure Python. Eliminates LLM-arithmetic drift.
    skill_profile = report_dict.get("skill_profile", {}) or {}
    raw_unified = skill_profile.get("unified_skills", []) or []
    fused = recompute_unified_skills(raw_unified)
    skill_profile["unified_skills"] = fused["unified_skills"]
    skill_profile["skill_summary"] = fused["skill_summary"]
    skill_profile["strongest_skills"] = fused["strongest_skills"]
    skill_profile["weakest_skills"] = fused["weakest_skills"]
    report_dict["skill_profile"] = skill_profile

    # Deterministic re-scoring of Career Mapper output: use the matched/gap
    # skill lists the LLM produced (its judgment is fine), but compute the
    # match_score in Python from the now-deterministic unified_skills.
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

