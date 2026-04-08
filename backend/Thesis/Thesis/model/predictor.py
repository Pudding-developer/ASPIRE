from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd

from .targets import (
    SKILL_CATEGORIES,
    compute_skill_scores,
    ilo_weighted_avg,
    map_avg_to_outcome,
)

THESIS_ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS   = THESIS_ROOT / "model" / "artifacts"


@dataclass
class PredictionResult:
    course: str
    ilo1: float
    ilo2: float
    ilo3: float
    ilo4: float
    ilo_avg: float
    predicted_skills: Dict[str, float]
    outcome_label: str
    strongest_skill: str
    weakest_skill: str
    # Scenario predictions for trend panel
    scenario_low: Dict[str, float] = field(default_factory=dict)   # ILOs at 70
    scenario_high: Dict[str, float] = field(default_factory=dict)  # ILOs at 90


class SkillsPredictor:
    def __init__(self) -> None:
        self._pipeline = joblib.load(ARTIFACTS / "skill_pipeline.joblib")
        meta = json.loads((ARTIFACTS / "meta.json").read_text(encoding="utf-8"))
        self._skill_categories: List[str] = meta["skill_categories"]

    def _make_X(self, course: str, ilo1: float, ilo2: float,
                ilo3: float, ilo4: float, semester: int = 4) -> pd.DataFrame:
        return pd.DataFrame([{
            "Course":   course,
            "Semester": semester,
            "ILO1":     ilo1,
            "ILO2":     ilo2,
            "ILO3":     ilo3,
            "ILO4":     ilo4,
            "ILO_avg":  ilo_weighted_avg(ilo1, ilo2, ilo3, ilo4),
        }])

    def _predict_skills(self, course: str, ilo1: float, ilo2: float,
                        ilo3: float, ilo4: float, semester: int = 4) -> Dict[str, float]:
        X    = self._make_X(course, ilo1, ilo2, ilo3, ilo4, semester)
        arr  = np.clip(self._pipeline.predict(X)[0], 0.0, 100.0)
        return {s: float(v) for s, v in zip(self._skill_categories, arr)}

    def predict(self, course: str, ilo1: float, ilo2: float,
                ilo3: float, ilo4: float, semester: int = 4) -> PredictionResult:

        skills = self._predict_skills(course, ilo1, ilo2, ilo3, ilo4, semester)
        avg    = ilo_weighted_avg(ilo1, ilo2, ilo3, ilo4)

        # Trend scenarios: keep proportional structure, shift ILO level
        def _scale(target_avg: float) -> Dict[str, float]:
            if avg == 0:
                factor = 1.0
            else:
                factor = target_avg / avg
            scaled_ilo = [np.clip(v * factor, 60.0, 98.0)
                          for v in [ilo1, ilo2, ilo3, ilo4]]
            return self._predict_skills(course, *scaled_ilo, semester)

        scenario_low  = _scale(70.0)
        scenario_high = _scale(90.0)

        active = {s: v for s, v in skills.items() if v > 1.0}
        if active:
            strongest = max(active, key=lambda k: active[k])
            weakest   = min(active, key=lambda k: active[k])
        else:
            strongest = max(skills, key=lambda k: skills[k])
            weakest   = min(skills, key=lambda k: skills[k])

        return PredictionResult(
            course=course,
            ilo1=ilo1, ilo2=ilo2, ilo3=ilo3, ilo4=ilo4,
            ilo_avg=avg,
            predicted_skills=skills,
            outcome_label=map_avg_to_outcome(avg),
            strongest_skill=strongest,
            weakest_skill=weakest,
            scenario_low=scenario_low,
            scenario_high=scenario_high,
        )
