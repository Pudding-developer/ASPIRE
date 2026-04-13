"""
github_search_tool.py — CrewAI tool that searches GitHub for learning repositories
relevant to a specific skill gap.

Uses the public GitHub search API (unauthenticated, read-only).
Wraps the call in try/except — returns an empty list on any failure so that
the pipeline continues without hard-crashing on API rate limits.
"""
import json

import httpx
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class GitHubSearchInput(BaseModel):
    skill_query: str = Field(
        description=(
            "A skill or topic to search for on GitHub. "
            "Examples: 'Docker beginner tutorial', 'FastAPI REST API example', "
            "'Redis Python tutorial'. Keep it concise for best results."
        )
    )


class GitHubSearchTool(BaseTool):
    name: str = "github_search"
    description: str = (
        "Searches GitHub for the top learning repositories related to a skill or topic. "
        "Returns up to 3 repositories sorted by stars, including name, description, "
        "star count, and URL. Use this to find concrete, community-verified learning "
        "resources for skill gaps. Provide a specific skill + context query "
        "(e.g., 'Docker beginner tutorial' rather than just 'Docker')."
    )
    args_schema: type[BaseModel] = GitHubSearchInput

    def _run(self, skill_query: str) -> str:
        """
        Query GitHub's public repository search API.
        Returns a JSON string with a list of up to 3 top repos.
        Returns an empty list on any failure (rate limit, network error, etc.).
        """
        try:
            url = "https://api.github.com/search/repositories"
            params = {
                "q": skill_query,
                "sort": "stars",
                "order": "desc",
                "per_page": 3,
            }
            headers = {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }

            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url, params=params, headers=headers)

            if resp.status_code != 200:
                return json.dumps({"skill_query": skill_query, "repositories": []})

            data = resp.json()
            items = data.get("items", [])[:3]

            repositories = [
                {
                    "name": repo.get("full_name", ""),
                    "description": repo.get("description") or "No description provided.",
                    "stars": repo.get("stargazers_count", 0),
                    "url": repo.get("html_url", ""),
                }
                for repo in items
            ]

            return json.dumps(
                {"skill_query": skill_query, "repositories": repositories},
                indent=2,
            )

        except Exception:
            # Never crash the pipeline — return empty gracefully
            return json.dumps({"skill_query": skill_query, "repositories": []})
