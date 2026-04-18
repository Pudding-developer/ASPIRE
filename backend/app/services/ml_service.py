"""
ml_service.py — Wraps the ml/ package for use by the ASPIRE backend.

Provides two entry points:
  - predict_skills()          → single course prediction
  - predict_student_aggregate() → aggregated profile across all courses
"""
import json
from pathlib import Path

from ml.config import map_avg_to_outcome, get_course_ilo_count
from ml.predictor import SkillsPredictor

# ── Paths ────────────────────────────────────────────────────────────────────
ML_ROOT             = Path(__file__).resolve().parents[2] / "ml"
ARTIFACTS           = ML_ROOT / "artifacts"
META_PATH           = ARTIFACTS / "meta.json"
SKILL_PIPELINE_PATH = ARTIFACTS / "skill_pipeline.joblib"

# ── Singletons ───────────────────────────────────────────────────────────────
_predictor: SkillsPredictor | None = None
_skill_categories: list[str] | None = None


def _load_model():
    """Load the trained pipeline once and cache it."""
    global _predictor, _skill_categories
    if _predictor is None:
        _predictor = SkillsPredictor()
        meta = json.loads(META_PATH.read_text(encoding="utf-8"))
        _skill_categories = meta["skill_categories"]
    return _predictor, _skill_categories


def predict_skills(course: str, ilo1: float, ilo2: float,
                   ilo3: float, ilo4: float, semester: int = 4) -> dict:
    """
    Predict skill scores for a student's course + ILO percentages.

    Returns:
        {
            "course", "ilo_scores", "ilo_avg", "outcome_label",
            "predicted_skills", "strongest_skill", "weakest_skill",
            "scenario_low", "scenario_high"
        }
    """
    predictor, _ = _load_model()
    result = predictor.predict(course, ilo1, ilo2, ilo3, ilo4, semester=semester)

    skills        = {s: round(float(v), 2) for s, v in result.predicted_skills.items()}
    scenario_low  = {s: round(float(v), 2) for s, v in result.scenario_low.items()}
    scenario_high = {s: round(float(v), 2) for s, v in result.scenario_high.items()}

    # Only echo back the ILOs this course actually uses (2, 3, or 4).
    ilo_count = get_course_ilo_count(course)
    raw_ilos  = [ilo1, ilo2, ilo3, ilo4]
    ilo_scores = {
        f"ilo{i + 1}": round(raw_ilos[i], 2) for i in range(ilo_count)
    }

    return {
        "course":           course,
        "ilo_scores":       ilo_scores,
        "ilo_avg":          round(result.ilo_avg, 2),
        "outcome_label":    result.outcome_label,
        "predicted_skills": skills,
        "strongest_skill":  result.strongest_skill,
        "weakest_skill":    result.weakest_skill,
        "scenario_low":     scenario_low,
        "scenario_high":    scenario_high,
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
