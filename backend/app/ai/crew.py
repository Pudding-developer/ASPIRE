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

from crewai import Crew, Process
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from google.genai import errors as genai_errors

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


def _run_with_retry(crew: Crew, inputs: dict):
    """
    Executes crew kickoff.
    Note: Rate limit retries are handled natively by liteLLM (max_retries=5) per individual API call.
    Restarting the entire CrewAI pipeline on a rate limit exception exhausts quota faster.
    """
    return crew.kickoff(inputs=inputs)


def build_and_run_crew(
    student_data: dict, 
    previous_report: str = None,
    subject_skill_context: str = "No subjects enrolled yet."
) -> dict:
    """
    Synchronous entry point — called via asyncio.to_thread() from pipeline_service.

    Builds the 7-agent crew, runs it sequentially, and returns the parsed
    CareerReport dict that matches the schema expected by the frontend.
    """
    # ── Instantiate shared tools ──────────────────────────────────────────────
    student_data_tool = StudentDataTool()
    student_data_tool.set_data(student_data)

    rag_career_tool = RAGCareerTool()
    github_search_tool = GitHubSearchTool()

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
        max_rpm=15,
    )

    try:
        result = _run_with_retry(crew, inputs={
            "student_name": student_data.get("full_name", "Unknown"),
            "sr_code":      student_data.get("sr_code", "N/A"),
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
    """
    # Define required keys for validation
    report_keys = [
        "career_matches", "recommendations", "summary",
        "skill_profile", "gap_analysis"
    ]
    # We validate a minimal set for progress to allow for variations between agent versions
    progress_keys = ["readiness_score_change", "summary"]

    report_dict = _parse_json_snippet(report_raw, required_keys=report_keys)
    progress_dict = _parse_json_snippet(progress_raw, required_keys=progress_keys)

    return {
        "career_matches":  report_dict.get("career_matches", []),
        "recommendations": report_dict.get("recommendations", []),
        "summary":         report_dict.get("summary", ""),
        "skill_profile":   report_dict.get("skill_profile", {}),
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

