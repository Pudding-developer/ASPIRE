"""
student_data_tool.py — CrewAI tool that provides pre-loaded student data to agents.

Data is fetched async by pipeline_service and set on the tool instance
before crew.kickoff() is called. As of the system-wide pseudonymization
work, `set_data` is always called with the output of
`pseudonymize_student_data(...)` from app.core.pseudonymizer, so no
cleartext sr_code, full_name, email, or GitHub username ever reaches the
agents through this tool. The data-minimization filter below remains as
defense-in-depth.
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
            
            # Aggregate scores in Python to avoid LLM reasoning/token overhead on large grade records
            from collections import defaultdict
            grouped = defaultdict(lambda: defaultdict(list))
            subject_course = {}
            for row in scores:
                sub = row.get("subject_name")
                course = row.get("course_code")
                if sub:
                    subject_course[sub] = course or ""
                    ilo = row.get("ilo_number")
                    pct = row.get("percentage", 0.0)
                    if ilo is not None:
                        grouped[sub][ilo].append(pct)
            
            summaries = []
            for sub, ilos in grouped.items():
                ilo_scores = {}
                ilo_pcounts = []
                for ilo in sorted(ilos.keys()):
                    pcts = ilos[ilo]
                    avg_ilo_pct = sum(pcts) / len(pcts) if pcts else 0.0
                    ilo_key = f"ILO{ilo}"
                    ilo_scores[ilo_key] = int(round(avg_ilo_pct))
                    ilo_pcounts.append(avg_ilo_pct)
                
                avg_score = round(sum(ilo_pcounts) / len(ilo_pcounts), 1) if ilo_pcounts else 0.0
                summaries.append({
                    "subject_name": sub,
                    "course_code": subject_course.get(sub, ""),
                    "ilo_scores": ilo_scores,
                    "avg_score": avg_score
                })
                
            subset = {
                # Omit sr_code and full_name (RA 10173 data minimization)
                "student_id": self._data.get("student_id"),
                "academic_subject_summaries": summaries,
            }
        elif query == "github":
            subset = {
                "student_id": self._data.get("student_id"),
                "github": self._data.get("github"),
            }
        else:
            subset = self._data

        return json.dumps(subset, indent=2, default=str)
