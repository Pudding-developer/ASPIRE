from crewai.tools import BaseTool
import httpx
from pydantic import BaseModel, Field

class GitHubSearchInput(BaseModel):
    skill_name: str = Field(
        default="",
        description="The name of the skill to search for tutorials on GitHub"
    )

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
        if not skill_name:
            return "No skill specified. Please provide a skill_name argument."
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
                return "No repositories found for this skill."
            
            # Format the top 3 results
            formatted_results = []
            for repo in items:
                name = repo.get("full_name", "N/A")
                desc = repo.get("description", "No description")
                stars = repo.get("stargazers_count", 0)
                url = repo.get("html_url", "N/A")
                
                res = (
                    f"- Repo: {name}\n"
                    f"  Description: {desc}\n"
                    f"  Stars: {stars}\n"
                    f"  URL: {url}\n"
                )
                formatted_results.append(res)
            
            return "\n".join(formatted_results)

        except Exception:
            # Handle network errors gracefully
            return ""
