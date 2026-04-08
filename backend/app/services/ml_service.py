"""
ml_service.py — Wraps the ml/ package for use by the ASPIRE backend.

Provides two entry points:
  - predict_skills()          → single course prediction
  - predict_student_aggregate() → aggregated profile across all courses
"""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from ml.config import (
    ilo_weighted_avg,
    map_avg_to_outcome,
)

# ── Paths ────────────────────────────────────────────────────────────────────
ML_ROOT             = Path(__file__).resolve().parents[2] / "ml"
ARTIFACTS           = ML_ROOT / "artifacts"
META_PATH           = ARTIFACTS / "meta.json"
SKILL_PIPELINE_PATH = ARTIFACTS / "skill_pipeline.joblib"

# ── Singleton model loader ───────────────────────────────────────────────────
_pipeline = None
_skill_categories = None


def _load_model():
    global _pipeline, _skill_categories
    if _pipeline is None:
        _pipeline = joblib.load(SKILL_PIPELINE_PATH)
        meta = json.loads(META_PATH.read_text(encoding="utf-8"))
        _skill_categories = meta["skill_categories"]
    return _pipeline, _skill_categories


def predict_skills(course: str, ilo1: float, ilo2: float,
                   ilo3: float, ilo4: float, semester: int = 4) -> dict:
    """
    Predict skill scores for a student's course + ILO percentages.

    Returns:
        {
            "course", "ilo_scores", "ilo_avg", "outcome_label",
            "predicted_skills", "strongest_skill", "weakest_skill"
        }
    """
    pipeline, skill_categories = _load_model()
    avg = ilo_weighted_avg(ilo1, ilo2, ilo3, ilo4)

    X = pd.DataFrame([{
        "Course":   course,
        "Semester": semester,
        "ILO1":     ilo1,
        "ILO2":     ilo2,
        "ILO3":     ilo3,
        "ILO4":     ilo4,
        "ILO_avg":  avg,
    }])

    raw = np.clip(pipeline.predict(X)[0], 0.0, 100.0)
    skills = {s: round(float(v), 2) for s, v in zip(skill_categories, raw)}

    active = {s: v for s, v in skills.items() if v > 1.0}
    if active:
        strongest = max(active, key=active.get)
        weakest   = min(active, key=active.get)
    else:
        strongest = max(skills, key=skills.get)
        weakest   = min(skills, key=skills.get)

    return {
        "course": course,
        "ilo_scores": {
            "ilo1": round(ilo1, 2),
            "ilo2": round(ilo2, 2),
            "ilo3": round(ilo3, 2),
            "ilo4": round(ilo4, 2),
        },
        "ilo_avg": round(avg, 2),
        "outcome_label": map_avg_to_outcome(avg),
        "predicted_skills": skills,
        "strongest_skill": strongest,
        "weakest_skill": weakest,
    }


def predict_student_aggregate(scores_by_course: list[dict]) -> dict:
    """
    Predict skills for multiple courses and aggregate into a student profile.

    Args:
        scores_by_course: list of { "course", "ilo1", "ilo2", "ilo3", "ilo4" }

    Returns:
        {
            "overall_ilo_avg", "overall_outcome", "per_course",
            "aggregated_skills", "top_skills", "weak_skills"
        }
    """
    if not scores_by_course:
        return {
            "overall_ilo_avg": 0.0,
            "overall_outcome": "No data",
            "per_course": [],
            "aggregated_skills": {},
            "top_skills": [],
            "weak_skills": [],
        }

    per_course = []
    all_ilo_avgs = []

    for entry in scores_by_course:
        result = predict_skills(
            course=entry["course"],
            ilo1=entry["ilo1"],
            ilo2=entry["ilo2"],
            ilo3=entry["ilo3"],
            ilo4=entry["ilo4"],
        )
        per_course.append(result)
        all_ilo_avgs.append(result["ilo_avg"])

    # Aggregate skills across all courses (average)
    _, skill_categories = _load_model()
    skill_totals = {s: [] for s in skill_categories}
    for result in per_course:
        for skill, score in result["predicted_skills"].items():
            if score > 1.0:
                skill_totals[skill].append(score)

    aggregated = {}
    for skill, values in skill_totals.items():
        aggregated[skill] = round(sum(values) / len(values), 2) if values else 0.0

    sorted_skills = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)
    active_skills = [(s, v) for s, v in sorted_skills if v > 1.0]

    overall_avg = round(sum(all_ilo_avgs) / len(all_ilo_avgs), 2)

    return {
        "overall_ilo_avg": overall_avg,
        "overall_outcome": map_avg_to_outcome(overall_avg),
        "per_course": per_course,
        "aggregated_skills": aggregated,
        "top_skills": [s for s, _ in active_skills[:5]],
        "weak_skills": [s for s, _ in active_skills[-5:]],
    }
