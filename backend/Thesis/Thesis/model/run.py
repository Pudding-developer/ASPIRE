"""
ASPIRE – Main entry point for skill prediction and dashboard rendering.

Usage:
    python -m model.run                                          # interactive
    python -m model.run --name "Alex" --course "Microprocessors" \
        --ilo1 45 50 --ilo2 38 40 --ilo3 42 50 --ilo4 35 40    # CLI
    python -m model.run ... --save                              # save PNG
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

from .predictor import PredictionResult, SkillsPredictor
from .targets import COURSE_PROFILES, SKILL_CATEGORIES
from .visualizer import render_dashboard

ARTIFACTS = Path(__file__).resolve().parents[1] / "model" / "artifacts"


def _load_metrics() -> dict:
    path = ARTIFACTS / "metrics.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def _prompt_ilo(label: str, description: str) -> tuple[float, float, float]:
    """Prompt for a score and its total; returns (raw, total, percentage)."""
    print(f"\n  {label}  ({description})")
    while True:
        try:
            raw   = float(input("    Score achieved  : "))
            total = float(input("    Total points    : "))
            if total <= 0:
                print("    Total must be greater than 0. Try again.")
                continue
            pct = (raw / total) * 100.0
            print(f"    => {raw:.0f}/{total:.0f}  =  {pct:.1f}%")
            return raw, total, pct
        except ValueError:
            print("    Please enter numeric values.")


def _prompt_inputs() -> tuple[str, str, list[float], list[float], list[float]]:
    """Interactive input; returns (student_name, course, ilo_raws, ilo_totals, ilo_pcts)."""
    known = list(COURSE_PROFILES.keys())

    print("\n" + "=" * 60)
    print("  ASPIRE  ")
    print("=" * 60)

    student_name = input("\n  Student name : ").strip() or "Student"

    print("\n  Available courses:")
    for i, c in enumerate(known, 1):
        print(f"    {i:2d}. {c}")

    print()
    choice = input("  Enter course name or number: ").strip()
    if choice.isdigit():
        idx = int(choice) - 1
        course = known[idx] if 0 <= idx < len(known) else choice
    else:
        course = choice

    print(f"\n  Course selected: {course}")
    print("  Enter ILO scores below (raw score out of total points):")

    ilo_raws, ilo_totals, ilo_pcts = [], [], []
    ilo_labels = [
        ("ILO 1", "Knowledge / Remembering"),
        ("ILO 2", "Comprehension / Understanding"),
        ("ILO 3", "Application / Applying"),
        ("ILO 4", "Analysis & Synthesis"),
    ]
    for lbl, desc in ilo_labels:
        raw, total, pct = _prompt_ilo(lbl, desc)
        ilo_raws.append(raw)
        ilo_totals.append(total)
        ilo_pcts.append(pct)

    return student_name, course, ilo_raws, ilo_totals, ilo_pcts


def main() -> None:
    ap = argparse.ArgumentParser(description="ASPIRE Skill Prediction Dashboard")
    ap.add_argument("--name",     default="", help="Student name")
    ap.add_argument("--course",   default="", help="Course title")
    # ILO args accept two values: score total  (e.g. --ilo1 45 50)
    ap.add_argument("--ilo1",     nargs=2, type=float, metavar=("SCORE", "TOTAL"))
    ap.add_argument("--ilo2",     nargs=2, type=float, metavar=("SCORE", "TOTAL"))
    ap.add_argument("--ilo3",     nargs=2, type=float, metavar=("SCORE", "TOTAL"))
    ap.add_argument("--ilo4",     nargs=2, type=float, metavar=("SCORE", "TOTAL"))
    ap.add_argument("--semester", type=int, default=4)
    ap.add_argument("--save",     action="store_true",
                    help="Save PNG to model/artifacts/ instead of opening window")
    args = ap.parse_args()

    if not (ARTIFACTS / "skill_pipeline.joblib").exists():
        print("ERROR: No trained model found. Run 'python -m model.train' first.")
        sys.exit(1)

    # ── Collect inputs ────────────────────────────────────────────────────────
    all_ilo_args = [args.ilo1, args.ilo2, args.ilo3, args.ilo4]
    if args.course and all(v is not None for v in all_ilo_args):
        student_name = args.name or "Student"
        course       = args.course
        ilo_raws     = [v[0] for v in all_ilo_args]
        ilo_totals   = [v[1] for v in all_ilo_args]
        ilo_pcts     = [r / t * 100.0 for r, t in zip(ilo_raws, ilo_totals)]
    else:
        student_name, course, ilo_raws, ilo_totals, ilo_pcts = _prompt_inputs()

    # ── Predict ───────────────────────────────────────────────────────────────
    predictor = SkillsPredictor()
    result    = predictor.predict(
        course=course,
        ilo1=ilo_pcts[0], ilo2=ilo_pcts[1],
        ilo3=ilo_pcts[2], ilo4=ilo_pcts[3],
        semester=args.semester,
    )

    # ── Terminal summary ──────────────────────────────────────────────────────
    print(f"\n  Course      : {result.course}")
    print(f"  ILO Average : {result.ilo_avg:.1f}%")
    print(f"  Performance : {result.outcome_label}")
    print(f"  Strongest   : {result.strongest_skill}  ({result.predicted_skills[result.strongest_skill]:.1f})")
    print(f"  Weakest     : {result.weakest_skill}  ({result.predicted_skills[result.weakest_skill]:.1f})")

    # ── Save prediction to CSV DataFrame ─────────────────────────────────────
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    df_dir = ARTIFACTS / "dataframes"
    df_dir.mkdir(parents=True, exist_ok=True)
    csv_path = df_dir / "predictions.csv"

    row = {
        "timestamp":     ts,
        "student_name":  student_name,
        "course":        result.course,
        "ilo1_pct":      round(result.ilo1, 2),
        "ilo2_pct":      round(result.ilo2, 2),
        "ilo3_pct":      round(result.ilo3, 2),
        "ilo4_pct":      round(result.ilo4, 2),
        "ilo_avg":       round(result.ilo_avg, 2),
        "outcome_label": result.outcome_label,
        "strongest_skill": result.strongest_skill,
        "weakest_skill":   result.weakest_skill,
        **{f"skill__{s}": round(result.predicted_skills[s], 2) for s in SKILL_CATEGORIES},
    }
    new_df = pd.DataFrame([row])
    if csv_path.exists():
        existing = pd.read_csv(csv_path)
        pd.concat([existing, new_df], ignore_index=True).to_csv(csv_path, index=False)
    else:
        new_df.to_csv(csv_path, index=False)
    print(f"  Prediction saved : {csv_path}")

    # ── Render ────────────────────────────────────────────────────────────────
    metrics  = _load_metrics()
    png_dir  = ARTIFACTS / "png"
    png_dir.mkdir(parents=True, exist_ok=True)
    save_path = png_dir / f"dashboard_{ts}.png"   # always auto-save

    render_dashboard(
        result       = result,
        metrics      = metrics,
        student_name = student_name,
        ilo_raw      = ilo_raws,
        ilo_totals   = ilo_totals,
        save_path    = save_path,
        show         = not args.save,              # interactive unless --save flag
    )


if __name__ == "__main__":
    main()
