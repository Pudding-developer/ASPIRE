"""
ml_service.py — Wraps the ml/ package for use by the ASPIRE backend.

Provides two entry points:
  - predict_skills()          → single course prediction
  - predict_student_aggregate() → aggregated profile across all courses
"""
import json
from pathlib import Path

from ml.config import (
    map_avg_to_outcome,
    get_course_ilo_count,
    COURSE_PROFILES,
    SO_NAMES,
    compute_so_scores,
    primary_so_for_skill,
)
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

    # Ground truth: The actual weighted average of the ILOs for this course.
    # This ensures the 'Course Standing' (e.g., 75.5%) communicates correctly with the skills.
    ilo_avg = result.ilo_avg
    
    # We blend the ML prediction with the raw ILO achievement to maintain ground-truth alignment.
    # CRITICAL: We also apply the course profile mask. If a course is not designed to 
    # develop a specific skill (profile weight = 0), we suppress the AI prediction 
    # to 0 to prevent nonsensical alignments (e.g., Drawing driving Microprocessors).
    profile = COURSE_PROFILES.get(course)
    _, skill_names = _load_model()
    
    skills = {}
    scenario_low = {}
    scenario_high = {}

    for i, s in enumerate(skill_names):
        weight = profile[i] if profile else 1.0
        
        # Current Prediction
        v = result.predicted_skills.get(s, 0)
        if weight > 0:
            skills[s] = round((ilo_avg * 0.7) + (float(v) * 0.3), 2)
            
            # Low scenario
            v_low = result.scenario_low.get(s, 0)
            scenario_low[s] = round((ilo_avg * 0.7) + (float(v_low) * 0.3), 2)
            
            # High scenario
            v_high = result.scenario_high.get(s, 0)
            high_val = (ilo_avg * 0.7) + (float(v_high) * 0.3)
            scenario_high[s] = round(max(high_val, skills[s]), 2)
        else:
            skills[s] = 0.0
            scenario_low[s] = 0.0
            scenario_high[s] = 0.0


    # Only echo back the ILOs this course actually uses (2, 3, or 4).
    ilo_count = get_course_ilo_count(course)
    raw_ilos  = [ilo1, ilo2, ilo3, ilo4]
    ilo_scores = {
        f"ilo{i + 1}": round(raw_ilos[i], 2) for i in range(ilo_count)
    }

    return {
        "course":           course,
        "ilo_scores":       ilo_scores,
        "ilo_avg":          round(ilo_avg, 2),
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
            "so_scores": {f"SO{i + 1}": 0.0 for i in range(len(SO_NAMES))},
            "so_names": SO_NAMES,
        }

    per_course = []
    all_ilo_avgs = []

    for entry in scores_by_course:
        course = entry["course"]

        # Skip baseline prediction when no scores have been submitted yet.
        # Otherwise the regression intercept reports phantom proficiency for
        # enrolled-but-unscored courses.
        raw_ilos_all = [entry.get(f"ilo{i + 1}", 0.0) for i in range(4)]
        if not any(v > 0 for v in raw_ilos_all):
            per_course.append({
                "course": course,
                "ilo_scores": {},
                "ilo_avg": 0.0,
                "outcome_label": "No Scores Yet",
                "predicted_skills": {},
                "strongest_skill": None,
                "weakest_skill": None,
                "scenario_low": {},
                "scenario_high": {},
            })
            continue

        # Robust case-insensitive matching for curriculum subjects
        profile_key = next((k for k in COURSE_PROFILES if k.lower() == course.lower()), None)

        if not profile_key:
            raw_ilos = [entry.get(f"ilo{i + 1}", 0.0) for i in range(4)]
            active = [v for v in raw_ilos if v > 0]
            ilo_avg = round(sum(active) / len(active), 2) if active else 0.0
            ilo_scores = {f"ilo{i + 1}": round(raw_ilos[i], 2)
                          for i in range(4) if raw_ilos[i] > 0}
            per_course.append({
                "course": course,
                "ilo_scores": ilo_scores,
                "ilo_avg": ilo_avg,
                "outcome_label": "Non-CpE Subject",
                "predicted_skills": {},
                "strongest_skill": None,
                "weakest_skill": None,
                "scenario_low": {},
                "scenario_high": {},
            })
            continue

        result = predict_skills(
            course=profile_key,
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
        # Use max() to reflect 'attainment accumulation' as requested.
        # This prevents mastery achieved in one course from being diluted by 
        # lower scores in other courses that map to the same skill.
        aggregated[skill] = round(max(values), 2) if values else 0.0

    sorted_skills = sorted(aggregated.items(), key=lambda x: x[1], reverse=True)
    active_skills = [(s, v) for s, v in sorted_skills if v > 1.0]

    # Overall performance is now the average of the accumulated skill proficiencies.
    active_vals = [v for s, v in active_skills]
    overall_avg = round(sum(active_vals) / len(active_vals), 2) if active_vals else 0.0

    # Project the 20 aggregated skills onto the 13 program SOs.
    # Recomputed on every aggregation, so SO proficiency moves whenever an
    # instructor's grade upload invalidates the predictions cache.
    so_scores = compute_so_scores(aggregated)

    top_names = [s for s, _ in active_skills[:5]]
    # "Developing" = active skills still below the 80% target. If a skill is
    # already at/above target it isn't developing, so excluding it prevents the
    # dashboard from labeling mastered skills as "Needs Attention".
    DEVELOPING_TARGET = 80
    weak_names = [s for s, v in active_skills if v < DEVELOPING_TARGET][-5:]

    # Map each highlighted skill to its primary SO so Smart Insights can show
    # the accreditation outcome a strong/weak skill aligns to.
    skill_so_map: dict[str, dict] = {}
    for s in {*top_names, *weak_names}:
        primary = primary_so_for_skill(s)
        if primary is not None:
            skill_so_map[s] = primary

    return {
        "overall_ilo_avg": overall_avg,
        "overall_outcome": map_avg_to_outcome(overall_avg),
        "per_course": per_course,
        "aggregated_skills": aggregated,
        "top_skills": top_names,
        "weak_skills": weak_names,
        "so_scores": so_scores,
        "so_names": SO_NAMES,
        "skill_so_map": skill_so_map,
    }
