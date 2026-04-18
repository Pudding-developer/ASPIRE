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
        max_rpm=3,
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
        # If crew fails produce minimal fallback report
        fallback = _parse_combined_output("{}", "{}")
        fallback["error"] = str(e)
        fallback["note"] = "Pipeline partially completed. Some data may be missing."
        return fallback

    # Extract raw outputs from the result object
    # result.tasks_output is a list of TaskOutput objects
    # Index 5 = report_task, Index 6 = progress_task
    report_raw = ""
    progress_raw = ""
    
    if hasattr(result, 'tasks_output') and len(result.tasks_output) >= 7:
        report_raw = result.tasks_output[5].raw
        progress_raw = result.tasks_output[6].raw
    else:
        # Fallback if task structure changed
        progress_raw = result.raw if hasattr(result, "raw") else str(result)

    return _parse_combined_output(report_raw, progress_raw)


def _parse_combined_output(report_raw: str, progress_raw: str) -> dict:
    """
    Parses and merges outputs from the Report Generator and Progress Tracker.
    """
    report_dict = _parse_json_snippet(report_raw)
    progress_dict = _parse_json_snippet(progress_raw)

    return {
        "career_matches":  report_dict.get("career_matches", []),
        "recommendations": report_dict.get("recommendations", []),
        "summary":         report_dict.get("summary", ""),
        "skill_profile":   report_dict.get("skill_profile", {}),
        "gap_analysis":    report_dict.get("gap_analysis", []),
        "market_data":     report_dict.get("market_data", {}),
        "progress":        progress_dict if progress_dict else _default_progression(),
    }


def _parse_json_snippet(raw: str) -> dict:
    """Helper to extract JSON from markdown fences."""
    cleaned = raw.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```", 1)[1].split("```", 1)[0]
    
    try:
        return json.loads(cleaned.strip())
    except Exception:
        return {}


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

