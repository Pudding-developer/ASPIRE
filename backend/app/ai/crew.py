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
from app.ai.agents.progress_agent import create_progress_tracker, create_progress_tracking_task


def _run_with_retry(crew: Crew, inputs: dict):
    """Executes crew kickoff with exponential backoff for Google API rate limits."""
    @retry(
        retry=retry_if_exception_type((
            genai_errors.ClientError,  # catches 429 rate limit
            Exception                   # fallback
        )),
        wait=wait_exponential(multiplier=2, min=10, max=60),
        stop=stop_after_attempt(5),
        reraise=True
    )
    def _execute():
        return crew.kickoff(inputs=inputs)

    return _execute()


def run_pipeline(student_data: dict) -> dict:
    """
    Synchronous entry point — called via asyncio.to_thread() from pipeline_service.

    Builds the 6-agent crew, runs it sequentially, and returns the parsed
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
        max_rpm=4,
    )

    result = _run_with_retry(crew, inputs={
        "student_name": student_data.get("full_name", "Unknown"),
        "sr_code":      student_data.get("sr_code", "N/A"),
    })

    raw_output = result.raw if hasattr(result, "raw") else str(result)
    return _parse_crew_output(raw_output)


def _parse_crew_output(raw: str) -> dict:
    """
    Best-effort parse of the crew's final raw output into the CareerReport dict.

    The LLM may wrap JSON in markdown code fences — strip them before parsing.
    Falls back to returning the raw string as the summary so the pipeline never
    raises an exception and always writes something to CareerReport.
    """
    cleaned = raw.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```", 1)[1].split("```", 1)[0]

    try:
        parsed = json.loads(cleaned.strip())
        return {
            "career_matches": parsed.get("career_matches", []),
            "recommendations": parsed.get("recommendations", []),
            "summary":         parsed.get("summary", ""),
            "skill_profile":   parsed.get("skill_profile", {}),
            "gap_analysis":    parsed.get("gap_analysis", []),
            "market_data":     parsed.get("market_data", {}),
            "progression":     parsed.get("progression", _default_progression()),
        }
    except (json.JSONDecodeError, AttributeError):
        return {
            "career_matches": [],
            "recommendations": [],
            "summary":         raw,
            "skill_profile":   {},
            "gap_analysis":    [],
            "market_data":     {},
            "progression":     _default_progression(),
        }


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

