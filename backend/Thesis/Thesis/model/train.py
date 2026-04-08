"""
Train and save the skill-prediction model.

Usage:
    python -m model.train
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import List

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import KFold, cross_val_score
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .targets import (
    COURSE_PROFILES,
    SKILL_CATEGORIES,
    compute_skill_scores,
    ilo_weighted_avg,
    map_avg_to_outcome,
)

THESIS_ROOT = Path(__file__).resolve().parents[1]
DATA_CSV    = THESIS_ROOT / "student_ilo_data.csv"
ARTIFACTS   = THESIS_ROOT / "model" / "artifacts"


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
    # Encode course as integer, then scale everything uniformly
    # (GBR is tree-based so scaling doesn't matter, but LabelEncoder is needed
    #  to convert course strings to numeric)
    from sklearn.preprocessing import OrdinalEncoder

    preprocessor = ColumnTransformer(
        transformers=[
            ("course", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), ["Course"]),
        ],
        remainder="passthrough",
    )

    # GradientBoosting: shallow trees + learning rate regularisation
    # max_depth=3 and min_samples_leaf=15 prevent overfitting on 1840 rows
    base_gbr = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=3,
        learning_rate=0.08,
        subsample=0.8,
        min_samples_leaf=15,
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

    # ── Load data ─────────────────────────────────────────────────────────
    df = pd.read_csv(DATA_CSV)
    required = {"Course", "Semester", "ILO1", "ILO2", "ILO3", "ILO4"}
    missing  = required - set(df.columns)
    if missing:
        raise ValueError(f"student_ilo_data.csv is missing columns: {sorted(missing)}")

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
            break  # single fold is sufficient for per-skill breakdown
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
