"""
github_agent.py — Agent 1: GitHub Repository Analyst.

Analyzes a student's cached GitHub repositories and contribution data
to extract concrete, evidence-backed technical skills.
"""
from crewai import Agent
from crewai import Task

from app.ai.llm_factory import get_llm


def create_github_analyzer(student_data_tool) -> Agent:
    return Agent(
        role="GitHub Repository Analyst",
        goal=(
            "Analyze a BSU Computer Engineering student's GitHub profile "
            "and extract concrete technical skills with evidence."
        ),
        backstory=(
            "You are an expert software engineer who specializes in "
            "reading GitHub portfolios. You analyze repository languages, dependencies, "
            "commit patterns, and contribution consistency to identify real technical "
            "skills — not generic labels. You distinguish between tutorial projects "
            "and original work. You never say 'the student knows Python' — you say "
            "'the student demonstrates intermediate Python proficiency based on async "
            "usage and OOP patterns across 4 repositories'."
        ),
        llm=get_llm(),
        tools=[student_data_tool],
        verbose=True,
        allow_delegation=False,
        max_iter=3,
        max_retry_limit=2,
    )


def create_github_analysis_task(agent: Agent) -> Task:
    return Task(
        description=(
            "Make EXACTLY ONE call to student_data_lookup with query='github' to fetch the "
            "student's full GitHub data. After that single call, do NOT call any tool again — "
            "proceed directly to producing the Final Answer JSON described below.\n\n"
            "For each repository analyze:\n"
            "- primary language and all used languages\n"
            "- dependencies extracted from package.json / requirements.txt / pom.xml / pubspec.yaml\n"
            "- repository topics and description\n"
            "- commit count and whether the project appears original vs tutorial "
            "(tutorials typically have names like 'todo-app', 'hello-world', 'tutorial-', "
            "or descriptions copied from course syllabi)\n\n"
            "Also analyze contribution statistics: total commits, current streak, "
            "consistency of contribution activity.\n\n"
            "Map everything to concrete skills with proficiency levels "
            "(beginner / intermediate / advanced) and confidence scores (0.0–1.0).\n\n"
            "Return ONLY a JSON object in this exact schema — no explanation text:\n"
            "{\n"
            '  "github_skills": [\n'
            "    {\n"
            '      "skill": "FastAPI",\n'
            '      "category": "Backend Development",\n'
            '      "proficiency": "intermediate",\n'
            '      "confidence": 0.85,\n'
            '      "evidence": ["aspire-backend", "thesis-api"],\n'
            '      "evidence_detail": "Uses async handlers, dependency injection, JWT auth"\n'
            "    }\n"
            "  ],\n"
            '  "top_languages": ["Python", "JavaScript"],\n'
            '  "total_commits": 847,\n'
            '  "current_streak": 14,\n'
            '  "original_projects": 3,\n'
            '  "tutorial_projects": 2\n'
            "}"
        ),
        expected_output=(
            "A JSON object with keys: github_skills (list), top_languages (list), "
            "total_commits (int), current_streak (int), original_projects (int), "
            "tutorial_projects (int). Return ONLY the JSON."
        ),
        agent=agent,
    )
