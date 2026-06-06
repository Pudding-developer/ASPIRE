"""
Train and save the skill-prediction model.

Reads real ILO data from the PostgreSQL database (instructor-entered scores)
instead of a static CSV file.

Usage:
    cd backend/
    python -m ml.training.train
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import KFold, cross_val_score
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from ml.config import (
    COURSE_PROFILES,
    COURSE_SEMESTER,
    SKILL_CATEGORIES,
    compute_skill_scores,
    ilo_weighted_avg,
)

ML_ROOT   = Path(__file__).resolve().parents[1]
ARTIFACTS = ML_ROOT / "artifacts"

# When the database has fewer than this many student-course observations,
# synthesize a curriculum-wide dataset so the model has enough samples to
# actually learn the (course, ILO) -> skill mapping.
MIN_REAL_SAMPLES = 200
SYNTHETIC_SAMPLES_PER_COURSE = 30

# SQL to compute ILO percentages per student per course.
# Aggregates across all assessments: AVG(score / max_score * 100) grouped by ILO number,
# then pivots ILO numbers 1-4 into columns.
_ILO_QUERY = text("""
    SELECT
        ss.student_id,
        c.subject_name  AS "Course",
        c.semester       AS "Semester",
        ROUND(AVG(CASE WHEN ai.ilo_number = 1 THEN ss.score / ai.max_score * 100 END)::numeric, 1) AS "ILO1",
        ROUND(AVG(CASE WHEN ai.ilo_number = 2 THEN ss.score / ai.max_score * 100 END)::numeric, 1) AS "ILO2",
        ROUND(AVG(CASE WHEN ai.ilo_number = 3 THEN ss.score / ai.max_score * 100 END)::numeric, 1) AS "ILO3",
        ROUND(AVG(CASE WHEN ai.ilo_number = 4 THEN ss.score / ai.max_score * 100 END)::numeric, 1) AS "ILO4"
    FROM student_scores ss
    JOIN assessment_ilos ai ON ss.ilo_id = ai.id
    JOIN assessments a      ON ss.assessment_id = a.id
    JOIN classes c           ON a.class_id = c.id
    WHERE ai.max_score > 0
    GROUP BY ss.student_id, c.id, c.subject_name, c.semester
    HAVING
        COUNT(CASE WHEN ai.ilo_number = 1 THEN 1 END) > 0 AND
        COUNT(CASE WHEN ai.ilo_number = 2 THEN 1 END) > 0 AND
        COUNT(CASE WHEN ai.ilo_number = 3 THEN 1 END) > 0 AND
        COUNT(CASE WHEN ai.ilo_number = 4 THEN 1 END) > 0
""")


def _get_sync_url() -> str:
    """Convert the async DATABASE_URL to a sync psycopg2 URL."""
    load_dotenv()
    url = os.getenv("DATABASE_URL", "")
    if not url:
        raise RuntimeError("DATABASE_URL is not set in .env")
    return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)


def _synthesize_ilo_data(rng: np.random.Generator, per_course: int) -> pd.DataFrame:
    """
    Build a synthetic curriculum-wide ILO dataset.

    For each course in COURSE_PROFILES, sample `per_course` virtual students
    whose ILO percentages follow a beta distribution centered around 80
    (typical passing band for BSCpE). The model trained on this dataset
    learns the new (course, ILO) -> skill mapping defined in targets.py.
    """
    rows: list[dict] = []
    for course in COURSE_PROFILES.keys():
        semester = COURSE_SEMESTER.get(course, 1)
        # alpha=8, beta=2 -> mean ~80, mostly in [60, 95]
        ilos = rng.beta(8.0, 2.0, size=(per_course, 4)) * 100.0
        for ilo1, ilo2, ilo3, ilo4 in ilos:
            rows.append({
                "Course": course,
                "Semester": semester,
                "ILO1": round(float(ilo1), 1),
                "ILO2": round(float(ilo2), 1),
                "ILO3": round(float(ilo3), 1),
                "ILO4": round(float(ilo4), 1),
            })
    return pd.DataFrame(rows)


def _load_ilo_data(rng: np.random.Generator) -> pd.DataFrame:
    """
    Fetch ILO data from the database and return a DataFrame.
    Augments with a synthetic curriculum-wide dataset when the DB has
    too few rows to train a generalizable model.
    """
    engine = create_engine(_get_sync_url(), echo=False)
    df = pd.read_sql(_ILO_QUERY, engine)
    engine.dispose()

    if not df.empty:
        df = df.drop(columns=["student_id"])
        required = {"Course", "Semester", "ILO1", "ILO2", "ILO3", "ILO4"}
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"Query result is missing columns: {sorted(missing)}")

    n_real = len(df)
    print(f"Loaded {n_real} student-course records from database")

    if n_real < MIN_REAL_SAMPLES:
        synth = _synthesize_ilo_data(rng, SYNTHETIC_SAMPLES_PER_COURSE)
        print(f"Augmenting with {len(synth)} synthetic curriculum-wide samples "
              f"({SYNTHETIC_SAMPLES_PER_COURSE} per course x {len(COURSE_PROFILES)} courses)")
        df = pd.concat([df, synth], ignore_index=True) if n_real else synth

    return df


def _build_training_data(df: pd.DataFrame, rng: np.random.Generator) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Returns X (features) and Y (skill targets) DataFrames.

    Each row = one student-course observation.
    Skill targets are computed with realistic noise so the model learns
    generalizable patterns instead of a deterministic formula.
    """
    skill_cols = [f"skill__{s}" for s in SKILL_CATEGORIES]
    rows_x: list[dict] = []
    rows_y: list[dict] = []

    for _, row in df.iterrows():
        course   = str(row["Course"])
        semester = int(row["Semester"])
        ilo1, ilo2 = float(row["ILO1"]), float(row["ILO2"])
        ilo3, ilo4 = float(row["ILO3"]), float(row["ILO4"])

        # ── Features ──────────────────────────────────────────────────────
        rows_x.append({
            "Course": course,
            "Semester": semester,
            "ILO1": ilo1,
            "ILO2": ilo2,
            "ILO3": ilo3,
            "ILO4": ilo4,
            "ILO_avg": ilo_weighted_avg(ilo1, ilo2, ilo3, ilo4),
        })

        # ── Targets with noise (breaks determinism → honest generalisation) ─
        scores = compute_skill_scores(
            course=course,
            ilo1=ilo1, ilo2=ilo2, ilo3=ilo3, ilo4=ilo4,
            noise_std=5.5,
            rng=rng,
        )
        rows_y.append({f"skill__{s}": v for s, v in scores.items()})

    X = pd.DataFrame(rows_x)
    Y = pd.DataFrame(rows_y, columns=skill_cols)
    return X, Y


def _build_pipeline() -> Pipeline:
    from sklearn.preprocessing import OneHotEncoder

    preprocessor = ColumnTransformer(
        transformers=[
            ("course", OneHotEncoder(handle_unknown="ignore", sparse_output=False), ["Course"]),
        ],
        remainder="passthrough",
    )

    base_gbr = GradientBoostingRegressor(
        n_estimators=250,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.8,
        min_samples_leaf=10,
        random_state=42,
    )
    regressor = MultiOutputRegressor(base_gbr, n_jobs=-1)

    return Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", regressor),
    ])


def train_and_save() -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(42)

    # ── Load data from database (augmented with synthetic when sparse) ────
    df = _load_ilo_data(rng)

    X, Y = _build_training_data(df, rng)
    y_arr = Y.to_numpy(dtype=float)

    # ── 5-fold cross-validation for honest metrics ─────────────────────────
    pipeline = _build_pipeline()
    kf       = KFold(n_splits=5, shuffle=True, random_state=42)

    cv_r2   = cross_val_score(pipeline, X, y_arr, cv=kf, scoring="r2",          n_jobs=-1)
    cv_mae  = -cross_val_score(pipeline, X, y_arr, cv=kf, scoring="neg_mean_absolute_error", n_jobs=-1)
    cv_rmse = np.sqrt(-cross_val_score(pipeline, X, y_arr, cv=kf,
                                        scoring="neg_mean_squared_error", n_jobs=-1))

    print(f"5-Fold CV  ->  R2: {cv_r2.mean():.4f} +/- {cv_r2.std():.4f}  |  "
          f"MAE: {cv_mae.mean():.3f}  |  RMSE: {cv_rmse.mean():.3f}")

    # ── Per-skill CV R² (one fold for speed) ──────────────────────────────
    per_skill_metrics: list[dict] = []
    for fold, (train_idx, test_idx) in enumerate(kf.split(X)):
        if fold > 0:
            break
        X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
        y_tr, y_te = y_arr[train_idx], y_arr[test_idx]
        pipeline.fit(X_tr, y_tr)
        y_pred = pipeline.predict(X_te)
        for idx, skill in enumerate(SKILL_CATEGORIES):
            per_skill_metrics.append({
                "skill": skill,
                "mae":  float(mean_absolute_error(y_te[:, idx], y_pred[:, idx])),
                "rmse": float(np.sqrt(mean_squared_error(y_te[:, idx], y_pred[:, idx]))),
                "r2":   float(r2_score(y_te[:, idx], y_pred[:, idx])),
            })

    # ── Fit final model on all data ────────────────────────────────────────
    pipeline = _build_pipeline()
    pipeline.fit(X, y_arr)

    # ── Save artifacts ─────────────────────────────────────────────────────
    joblib.dump(pipeline, ARTIFACTS / "skill_pipeline.joblib")

    metrics = {
        "skills_regression": {
            "cv_r2_mean":  float(cv_r2.mean()),
            "cv_r2_std":   float(cv_r2.std()),
            "cv_mae_mean": float(cv_mae.mean()),
            "cv_rmse_mean": float(cv_rmse.mean()),
            "per_skill": per_skill_metrics,
        }
    }
    (ARTIFACTS / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    meta = {
        "skill_categories": SKILL_CATEGORIES,
        "known_courses": list(COURSE_PROFILES.keys()),
        "feature_columns": ["Course", "Semester", "ILO1", "ILO2", "ILO3", "ILO4", "ILO_avg"],
    }
    (ARTIFACTS / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    print(f"Artifacts saved to {ARTIFACTS}")


if __name__ == "__main__":
    train_and_save()
