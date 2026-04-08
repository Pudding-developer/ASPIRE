"""
agents.py — CrewAI agent definitions for the ASPIRE skill-mapping pipeline.
"""
from crewai import Agent, LLM

from app.ai.tools.student_data_tool import StudentDataTool
from app.ai.tools.rag_career_tool import RAGCareerTool
from app.core.config import GEMINI_API_KEY


def _get_llm() -> LLM:
    return LLM(
        model="gemini/gemini-2.0-flash",
        api_key=GEMINI_API_KEY,
    )


def create_skill_analyst(student_data_tool: StudentDataTool) -> Agent:
    return Agent(
        role="Student Skill Analyst",
        goal=(
            "Analyze a Computer Engineering student's academic scores and "
            "GitHub activity to produce a detailed skill profile with "
            "proficiency levels and evidence sources."
        ),
        backstory=(
            "You are an expert educational data analyst at Batangas State "
            "University's Computer Engineering department. You specialize in "
            "evaluating student competencies by cross-referencing ILO-based "
            "assessment scores with real-world coding activity on GitHub. "
            "You are precise, evidence-based, and fair in your assessments."
        ),
        llm=_get_llm(),
        tools=[student_data_tool],
        verbose=False,
    )


def create_career_advisor(rag_tool: RAGCareerTool) -> Agent:
    return Agent(
        role="Career Readiness Advisor",
        goal=(
            "Map a student's identified skills to relevant Computer Engineering "
            "career paths by querying the ASPIRE knowledge base, calculate match scores, "
            "identify skill gaps, and provide actionable career preparation recommendations."
        ),
        backstory=(
            "You are a career counselor who specializes in Computer Engineering "
            "career pathways in the Philippines and globally. You use the RAG knowledge "
            "base to find evidence-based career matches rather than relying on general "
            "knowledge. You understand industry hiring requirements and can match student "
            "skill profiles to the most promising career opportunities. You provide "
            "practical, specific advice rather than generic platitudes."
        ),
        llm=_get_llm(),
        tools=[rag_tool],
        verbose=False,
    )
