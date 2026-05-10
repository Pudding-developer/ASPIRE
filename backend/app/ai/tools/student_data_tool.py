"""
student_data_tool.py — CrewAI tool that provides pre-loaded student data to agents.

Data is fetched async by pipeline_service and set on the tool instance
before crew.kickoff() is called.
"""
import json

from crewai.tools import BaseTool
from pydantic import BaseModel, Field, PrivateAttr


class StudentDataInput(BaseModel):
    query: str = Field(
        default="all",
        description="What data to retrieve: 'all', 'academic', or 'github'",
    )


class StudentDataTool(BaseTool):
    name: str = "student_data_lookup"
    description: str = (
        "Retrieves comprehensive student data including academic scores "
        "(assessment names, ILO scores, percentages) and GitHub activity "
        "(repositories, languages, contributions, streaks). "
        "Use query='all' for everything, 'academic' for scores only, "
        "or 'github' for GitHub activity only."
    )
    args_schema: type[BaseModel] = StudentDataInput
    _data: dict = PrivateAttr(default_factory=dict)

    def set_data(self, data: dict) -> None:
        self._data = data

    def _run(self, query: str = "all") -> str:
        if not self._data:
            return "No student data loaded."

        if query == "academic":
            scores = self._data.get("academic_scores", [])
            if not scores:
                return json.dumps({
                    "student_id": self._data.get("student_id"),
                    "academic": {
                        "classes": [],
                        "assessments": [],
                        "scores": [],
                        "ml_predictions": {},
                        "note": "No academic data available yet"
                    }
                }, indent=2, default=str)
            subset = {
                # Omit sr_code and full_name — these are direct PII and the
                # LLM has no analytical need for them (RA 10173 data minimization).
                "student_id": self._data.get("student_id"),
                "academic_scores": scores,
            }
        elif query == "github":
            subset = {
                "student_id": self._data.get("student_id"),
                "github": self._data.get("github"),
            }
        else:
            subset = self._data

        return json.dumps(subset, indent=2, default=str)
