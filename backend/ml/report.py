"""
build_course_report — pure-data ASPIRE course report.

Returns a JSON-serializable dict the frontend renders into charts.
No matplotlib, no files, no I/O beyond loading the trained model.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from ml.config import (
    COURSE_PROFILES,
    SKILL_CATEGORIES,
    get_course_code,
    get_course_ilo_count,
    compute_so_scores,
    SO_NAMES,
)
from ml.predictor import SkillsPredictor

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
ACTIVE_THRESHOLD = 0.15          # min profile weight for a skill to count as course-active
TOP_EXCELLED_COUNT = 4

_predictor: Optional[SkillsPredictor] = None
_metrics_cache: Optional[dict] = None


def _load_predictor() -> SkillsPredictor:
    global _predictor
    if _predictor is None:
        _predictor = SkillsPredictor()
    return _predictor


def _load_metrics() -> dict:
    global _metrics_cache
    if _metrics_cache is None:
        path = ARTIFACTS / "metrics.json"
        _metrics_cache = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    return _metrics_cache


def _course_profile(course: str) -> Dict[str, float]:
    weights = COURSE_PROFILES.get(course)
    if weights is None:
        return {s: 0.0 for s in SKILL_CATEGORIES}
    return {s: float(w) for s, w in zip(SKILL_CATEGORIES, weights)}


def build_course_report(
    course: str,
    ilo_raw: List[float],
    ilo_totals: List[float],
    student_name: str = "",
    semester: Optional[int] = None,
) -> dict:
    if course not in COURSE_PROFILES:
        raise ValueError(f"Unknown course: {course}")
    if len(ilo_raw) != len(ilo_totals):
        raise ValueError("ilo_raw and ilo_totals must have the same length")

    expected_ilo_count = get_course_ilo_count(course)
    if len(ilo_raw) == 0:
        raise ValueError(f"{course} requires {expected_ilo_count} ILO score(s); got 0")

    percentages = [
        round((r / t) * 100.0, 2) if t > 0 else 0.0
        for r, t in zip(ilo_raw, ilo_totals)
    ]

    padded_pct = percentages + [0.0] * (4 - len(percentages))
    predictor  = _load_predictor()
    result     = predictor.predict(course, *padded_pct[:4], semester=semester or 4)

    profile   = _course_profile(course)
    predicted = {s: round(float(v), 2) for s, v in result.predicted_skills.items()}

    active = [
        {"skill": s, "weight": round(w, 3), "predicted": predicted.get(s, 0.0)}
        for s, w in profile.items()
        if w >= ACTIVE_THRESHOLD
    ]
    active.sort(key=lambda x: x["weight"], reverse=True)
    top_excelled = active[:TOP_EXCELLED_COUNT]

    metrics        = _load_metrics().get("skills_regression", {})
    scenario_low   = {s: round(float(v), 2) for s, v in result.scenario_low.items()}
    scenario_high  = {s: round(float(v), 2) for s, v in result.scenario_high.items()}

    # Map skill scenarios to SO scenarios for the course breakdown view
    so_scenario_low = compute_so_scores(result.scenario_low)
    so_scenario_high = compute_so_scores(result.scenario_high)

    return {
        "student_name": student_name,
        "course": course,
        "course_code": get_course_code(course),
        "semester": semester,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),

        "ilo": {
            "count": len(percentages),
            "raw":         [round(float(v), 2) for v in ilo_raw],
            "totals":      [round(float(v), 2) for v in ilo_totals],
            "percentages": percentages,
            "weighted_avg": round(result.ilo_avg, 2),
            "outcome_label": result.outcome_label,
        },

        "skills": {
            "categories":      list(SKILL_CATEGORIES),
            "predicted":       predicted,
            "profile_weights": {s: round(w, 3) for s, w in profile.items()},
            "active":          active,
            "top_excelled":    top_excelled,
            "strongest":       result.strongest_skill,
            "weakest":         result.weakest_skill,
        },

        "trend": {
            "scenario_low":  scenario_low,
            "scenario_high": scenario_high,
            "so_scenario_low":  so_scenario_low,
            "so_scenario_high": so_scenario_high,
        },

        "model": {
            "cv_r2_mean":   round(float(metrics.get("cv_r2_mean",   0.0)), 4),
            "cv_mae_mean":  round(float(metrics.get("cv_mae_mean",  0.0)), 3),
            "cv_rmse_mean": round(float(metrics.get("cv_rmse_mean", 0.0)), 3),
        },
        "so": {
            "scores": compute_so_scores(predicted),
            "names": SO_NAMES,
        },
    }
