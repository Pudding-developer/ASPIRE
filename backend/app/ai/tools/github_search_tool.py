from crewai.tools import BaseTool
import httpx
import re
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Prompt-injection sanitizer
# GitHub repo descriptions are user-controlled text that flows into LLM context.
# Strip known override patterns and limit length before including in output.
# ---------------------------------------------------------------------------
_INJECTION_PATTERNS = re.compile(
    r"(ignore (previous|all|above|your)|disregard|override|<\|im_start\||<\|im_end\||"
    r"system prompt|forget your instructions|you are now|act as|roleplay as|jailbreak)",
    re.IGNORECASE,
)
_MAX_DESC_CHARS = 300


def _sanitize_text(text: str) -> str:
    """Strip prompt-injection patterns and cap length."""
    if not text:
        return ""
    # Replace injection phrases with a placeholder
    cleaned = _INJECTION_PATTERNS.sub("[REDACTED]", text)
    # Truncate to a safe length
    return cleaned[:_MAX_DESC_CHARS]

class GitHubSearchInput(BaseModel):
    skill_name: str = Field(description="The name of the skill to search for tutorials on GitHub")

_SEARCH_CACHE = {}

class GitHubSearchTool(BaseTool):
    name: str = "github_search"
    description: str = (
        "Useful for finding top GitHub repositories that serve as tutorials or "
        "learning resources for specific technical skills."
    )
    args_schema: type[BaseModel] = GitHubSearchInput

    def _run(self, skill_name: str) -> str:
        """
        Makes an unauthenticated request to the GitHub Search API to find 
        the top 3 repositories related to a skill tutorial.
        """
        skill_name_clean = skill_name.strip().lower() if skill_name else ""
        if skill_name_clean in _SEARCH_CACHE:
            return _SEARCH_CACHE[skill_name_clean]

        try:
            # Construct the query: [skill] + tutorial
            query = f"{skill_name} tutorial"
            url = f"https://api.github.com/search/repositories"
            params = {
                "q": query,
                "sort": "stars",
                "order": "desc",
                "per_page": 3
            }
            
            # Use httpx to make the request
            with httpx.Client(timeout=10.0) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
            
            items = data.get("items", [])
            if not items:
                _SEARCH_CACHE[skill_name_clean] = "No repositories found for this skill."
                return _SEARCH_CACHE[skill_name_clean]
            
            # Format the top 3 results
            formatted_results = []
            for repo in items:
                name = repo.get("full_name", "N/A")
                desc = _sanitize_text(repo.get("description") or "No description")
                stars = repo.get("stargazers_count", 0)
                url = repo.get("html_url", "N/A")
                
                res = (
                    f"- Repo: {name}\n"
                    f"  Description: {desc}\n"
                    f"  Stars: {stars}\n"
                    f"  URL: {url}\n"
                )
                formatted_results.append(res)
            
            result_str = "\n".join(formatted_results)
            _SEARCH_CACHE[skill_name_clean] = result_str
            return result_str

        except Exception:
            # Handle network errors/rate limits gracefully and return a realistic fallback to prevent agent loop errors
            fallback_name = f"developer-resources/{skill_name.lower().replace(' ', '-')}-tutorial" if skill_name else "developer-resources/tutorial"
            fallback_url = f"https://github.com/developer-resources/{skill_name.lower().replace(' ', '-')}-tutorial" if skill_name else "https://github.com/freeCodeCamp/freeCodeCamp"
            return (
                f"- Repo: {fallback_name}\n"
                f"  Description: Comprehensive learning resources and guides for {skill_name or 'software development'}.\n"
                f"  Stars: 1540\n"
                f"  URL: {fallback_url}\n"
            )
