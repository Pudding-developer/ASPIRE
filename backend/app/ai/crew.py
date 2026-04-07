"""
crew.py — Assembles and runs the CrewAI pipeline for student skill mapping.
"""
import json

from crewai import Crew, Process, Task

from app.ai.agents import create_skill_analyst, create_career_advisor
from app.ai.tools.student_data_tool import StudentDataTool
from app.ai.tools.career_taxonomy_tool import CareerTaxonomyTool


def run_pipeline(student_data: dict) -> dict:
    """
    Synchronous entry point — called via asyncio.to_thread() from the service.
    Returns a dict with skill_profile, career_matches, recommendations, summary.
    """
    # Prepare tools
    student_data_tool = StudentDataTool()
    student_data_tool.set_data(student_data)
    career_taxonomy_tool = CareerTaxonomyTool()

    # Create agents
    skill_analyst = create_skill_analyst(student_data_tool)
    career_advisor = create_career_advisor(career_taxonomy_tool)

    # Define tasks
    analyze_task = Task(
        description=(
            "Analyze the student's data using the student_data_lookup tool. "
            "Call the tool with query='all' to retrieve the full dataset.\n\n"
            "Student: {student_name} (SR Code: {sr_code})\n\n"
            "From the data, identify:\n"
            "1. Technical skills with proficiency levels (beginner/intermediate/advanced) "
            "and whether each skill is evidenced by academic scores, GitHub activity, or both.\n"
            "2. Programming languages used and proficiency.\n"
            "3. Frameworks and tools demonstrated in GitHub repositories.\n"
            "4. Key strengths based on high assessment scores and active GitHub projects.\n"
            "5. Weaknesses or gaps based on low scores or missing competencies.\n\n"
            "Be specific — cite assessment names, repository names, and score percentages as evidence."
        ),
        expected_output=(
            "A JSON object with these keys:\n"
            "- technical_skills: list of {{name, proficiency, source}}\n"
            "- programming_languages: list of {{name, proficiency, source}}\n"
            "- frameworks: list of framework/tool name strings\n"
            "- strengths: list of specific strength descriptions\n"
            "- weaknesses: list of specific weakness/gap descriptions"
        ),
        agent=skill_analyst,
    )

    career_task = Task(
        description=(
            "Using the skill profile from the previous analysis and the "
            "career_taxonomy tool, map this student's competencies to Computer "
            "Engineering career paths.\n\n"
            "Call the career_taxonomy tool with query='all' to get every career path.\n\n"
            "For each relevant career:\n"
            "1. Calculate a match_score (0-100) based on how many core skills "
            "the student already has vs. what the career requires.\n"
            "2. List matched_skills the student already possesses.\n"
            "3. List gap_skills the student needs to develop.\n"
            "4. Provide brief reasoning for the score.\n\n"
            "Then provide:\n"
            "- 3-5 specific, actionable recommendations for career preparation "
            "(courses to take, projects to build, certifications to pursue).\n"
            "- A 2-3 paragraph career readiness summary for the student."
        ),
        expected_output=(
            "A JSON object with these keys:\n"
            "- career_matches: list of {{title, match_score, reasoning, matched_skills, gap_skills}} "
            "(sorted by match_score descending, top 5)\n"
            "- recommendations: list of actionable recommendation strings\n"
            "- summary: a 2-3 paragraph career readiness summary"
        ),
        agent=career_advisor,
        context=[analyze_task],
    )

    # Assemble and run crew
    crew = Crew(
        agents=[skill_analyst, career_advisor],
        tasks=[analyze_task, career_task],
        process=Process.sequential,
        verbose=False,
    )

    result = crew.kickoff(inputs={
        "student_name": student_data.get("full_name", "Unknown"),
        "sr_code": student_data.get("sr_code", "N/A"),
    })

    # Parse the final output
    raw_output = result.raw if hasattr(result, "raw") else str(result)
    return _parse_crew_output(raw_output)


def _parse_crew_output(raw: str) -> dict:
    """Best-effort parse of the crew's raw output into a structured dict."""
    # Try to extract JSON from the raw output
    # The LLM may wrap JSON in markdown code blocks
    cleaned = raw.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json", 1)[1]
        cleaned = cleaned.split("```", 1)[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```", 1)[1]
        cleaned = cleaned.split("```", 1)[0]

    try:
        parsed = json.loads(cleaned.strip())
        return {
            "career_matches": parsed.get("career_matches", []),
            "recommendations": parsed.get("recommendations", []),
            "summary": parsed.get("summary", ""),
            "skill_profile": parsed.get("skill_profile", {}),
        }
    except (json.JSONDecodeError, AttributeError):
        # If JSON parsing fails, return the raw text as the summary
        return {
            "career_matches": [],
            "recommendations": [],
            "summary": raw,
            "skill_profile": {},
        }
