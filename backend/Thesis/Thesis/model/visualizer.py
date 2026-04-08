"""
ASPIRE – Academic Student Performance Intelligence & Reporting Engine
Dashboard renderer  (no sidebar, content-only layout).
"""
from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional, Tuple

import matplotlib
import matplotlib.backend_bases
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Wedge
import numpy as np

from .predictor import PredictionResult
from .targets import COURSE_PROFILES, SKILL_CATEGORIES, get_course_code

# ── ASPIRE palette ────────────────────────────────────────────────────────────
MAIN_BG  = "#F2F3F8"
CARD_BG  = "#FFFFFF"
CARD_BD  = "#DDE0EE"
ACCENT   = "#9B2020"
ACCENT2  = "#C0392B"
SUCCESS  = "#1E8449"
WARNING  = "#D4820A"
DANGER   = "#C0392B"
NEUTRAL  = "#9AA5BE"
TEXT_H   = "#12122A"
TEXT_B   = "#3A3A5C"
TEXT_S   = "#7A7A9A"
BLUE     = "#2980B9"
PURPLE   = "#7D3C98"

ACTIVE_THRESHOLD = 0.15   # minimum profile weight to count a skill as course-active


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_profile(course: str) -> np.ndarray:
    if course in COURSE_PROFILES:
        return np.array(COURSE_PROFILES[course], dtype=float)
    return np.array(list(COURSE_PROFILES.values()), dtype=float).mean(axis=0)


def _pct_of_target(score: float, weight: float) -> float:
    target = weight * 100.0
    return min(float(score) / target * 100.0, 100.0) if target > 0 else 0.0


def _status(pct: float) -> Tuple[str, str]:
    if pct >= 85: return "EXCEEDING EXPECTATIONS", SUCCESS
    if pct >= 65: return "ON TRACK",               WARNING
    return "NEEDS ATTENTION", DANGER


def _card(ax: plt.Axes) -> None:
    ax.set_facecolor(CARD_BG)
    for sp in ax.spines.values():
        sp.set_edgecolor(CARD_BD)
        sp.set_linewidth(0.8)
    ax.tick_params(left=False, bottom=False,
                   labelleft=False, labelbottom=False)


def _section_label(ax: plt.Axes, title: str, subtitle: str = "") -> None:
    ax.text(0.016, 0.980, title,
            transform=ax.transAxes, ha='left', va='top',
            color=TEXT_H, fontsize=10, fontweight='bold')
    if subtitle:
        ax.text(0.016, 0.942, subtitle,
                transform=ax.transAxes, ha='left', va='top',
                color=TEXT_S, fontsize=7.5)


# ─────────────────────────────────────────────────────────────────────────────
# Header
# ─────────────────────────────────────────────────────────────────────────────
def _draw_header(ax: plt.Axes, student_name: str, course: str,
                 outcome: str) -> None:
    _card(ax)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_axis_off()

    code = get_course_code(course)
    course_line = f"{code}  ·  {course}" if code else course

    # Left accent stripe
    ax.add_patch(FancyBboxPatch(
        (0.000, 0.0), 0.0025, 1.0,
        boxstyle="square,pad=0", facecolor=ACCENT,
        transform=ax.transAxes))

    # ASPIRE badge top-left
    ax.text(0.010, 0.95, "ASPIRE", transform=ax.transAxes,
            ha='left', va='top', color=ACCENT,
            fontsize=9, fontweight='bold')
    ax.text(0.010, 0.75, "STUDENT OVERVIEW",
            transform=ax.transAxes, ha='left', va='top',
            color=TEXT_S, fontsize=7, fontweight='bold')

    # Student name (large)
    ax.text(0.010, 0.52, student_name,
            transform=ax.transAxes, ha='left', va='top',
            color=TEXT_H, fontsize=20, fontweight='bold')

    # Course info
    ax.text(0.010, 0.08, f"BS Computer Engineering  ·  {course_line}",
            transform=ax.transAxes, ha='left', va='bottom',
            color=TEXT_B, fontsize=8.5)

    # Performance tier badge (right side)
    oc_map = {
        "Very Good": SUCCESS,        "Good": SUCCESS,
        "Meritorious": BLUE,         "Very Satisfactory": BLUE,
        "Satisfactory": WARNING,     "Fairly Satisfactory": WARNING,
        "Passing": DANGER,           "Failure": "#6E0000",
    }
    oc_col = oc_map.get(outcome, ACCENT)

    ax.add_patch(FancyBboxPatch(
        (0.790, 0.12), 0.195, 0.76,
        boxstyle="round,pad=0.015",
        facecolor=oc_col, edgecolor='none', alpha=0.10,
        transform=ax.transAxes))
    ax.add_patch(FancyBboxPatch(
        (0.790, 0.12), 0.004, 0.76,
        boxstyle="square,pad=0",
        facecolor=oc_col, edgecolor='none',
        transform=ax.transAxes))
    ax.text(0.888, 0.67, "PERFORMANCE TIER",
            transform=ax.transAxes, ha='center', va='center',
            color=oc_col, fontsize=6.5, fontweight='bold')
    ax.text(0.888, 0.34, outcome,
            transform=ax.transAxes, ha='center', va='center',
            color=oc_col, fontsize=11, fontweight='bold')


# ─────────────────────────────────────────────────────────────────────────────
# Stat card
# ─────────────────────────────────────────────────────────────────────────────
def _draw_stat_card(ax: plt.Axes, label: str, value: str,
                    sub: str, color: str) -> None:
    _card(ax)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_axis_off()

    ax.add_patch(FancyBboxPatch(
        (0.0, 0.0), 1.0, 0.040,
        boxstyle="square,pad=0", facecolor=color,
        transform=ax.transAxes, alpha=0.90))

    ax.text(0.08, 0.88, label.upper(),
            transform=ax.transAxes, ha='left', va='top',
            color=TEXT_S, fontsize=6.5, fontweight='bold')
    ax.text(0.08, 0.58, value,
            transform=ax.transAxes, ha='left', va='center',
            color=TEXT_H, fontsize=19, fontweight='bold')
    ax.text(0.08, 0.22, sub,
            transform=ax.transAxes, ha='left', va='center',
            color=color, fontsize=7.5)


# ─────────────────────────────────────────────────────────────────────────────
# Donut – Learning Outcome Status
# ─────────────────────────────────────────────────────────────────────────────
def _draw_donut(ax: plt.Axes, result: PredictionResult,
                ilo_raw: List[float], ilo_totals: List[float]) -> None:
    _card(ax)
    ax.set_axis_off()
    _section_label(ax, "Learning Outcome Status",
                   "ILO coverage analytics")

    ilo_avg = result.ilo_avg

    # ── Donut ─────────────────────────────────────────────────────────────
    da = ax.inset_axes([0.05, 0.40, 0.55, 0.52])
    da.set_facecolor(CARD_BG)
    da.set_axis_off()
    da.set_xlim(-1.3, 1.3)
    da.set_ylim(-1.3, 1.3)

    da.add_patch(Wedge((0, 0), 1.05, 0, 360, width=0.32,
                       facecolor=CARD_BD, edgecolor='none', zorder=1))
    theta1 = 90 - (ilo_avg / 100.0 * 360)
    da.add_patch(Wedge((0, 0), 1.05, theta1, 90, width=0.32,
                       facecolor=ACCENT, edgecolor='none', zorder=2))
    da.add_patch(plt.Circle((0, 0), 0.73, color=CARD_BG, zorder=3))
    da.text(0, 0.18, f"{ilo_avg:.1f}%", ha='center', va='center',
            color=TEXT_H, fontsize=19, fontweight='bold', zorder=4)
    da.text(0, -0.22, "TOTAL CORE", ha='center', va='center',
            color=TEXT_S, fontsize=7, fontweight='bold', zorder=4)

    # ── ILO bars ──────────────────────────────────────────────────────────
    ilo_pcts   = [r / t * 100 for r, t in zip(ilo_raw, ilo_totals)]
    ilo_colors = [ACCENT, "#D4561A", WARNING, BLUE]
    ilo_descs  = ["Knowledge", "Comprehension", "Application", "Analysis"]

    ba = ax.inset_axes([0.04, 0.04, 0.92, 0.34])
    ba.set_facecolor(CARD_BG)
    ba.set_axis_off()
    ba.set_xlim(0, 1)
    ba.set_ylim(0, 1)

    for i, (pct, col, desc) in enumerate(zip(ilo_pcts, ilo_colors, ilo_descs)):
        y = 0.84 - i * 0.24
        ba.text(0.01, y, f"ILO {i+1}",
                transform=ba.transAxes, ha='left', va='center',
                color=TEXT_B, fontsize=7.5, fontweight='bold')
        ba.text(0.22, y, desc,
                transform=ba.transAxes, ha='left', va='center',
                color=TEXT_S, fontsize=7)
        ba.text(0.99, y,
                f"{ilo_raw[i]:.0f} / {ilo_totals[i]:.0f}  ({pct:.1f}%)",
                transform=ba.transAxes, ha='right', va='center',
                color=col, fontsize=7, fontweight='bold')
        bx, bw, bh = 0.01, 0.98, 0.09
        by = y - 0.17
        ba.add_patch(FancyBboxPatch((bx, by), bw, bh,
                                    boxstyle="round,pad=0.004",
                                    facecolor=MAIN_BG, edgecolor='none',
                                    transform=ba.transAxes))
        fw = bw * min(pct / 100.0, 1.0)
        if fw > 0.002:
            ba.add_patch(FancyBboxPatch((bx, by), fw, bh,
                                        boxstyle="round,pad=0.004",
                                        facecolor=col, edgecolor='none',
                                        alpha=0.85,
                                        transform=ba.transAxes))


# ─────────────────────────────────────────────────────────────────────────────
# Developing Skills bar panel
# ─────────────────────────────────────────────────────────────────────────────
def _draw_skills(ax: plt.Axes, result: PredictionResult,
                 profile: np.ndarray,
                 all_active: Optional[List] = None,
                 offset: int = 0,
                 page_size: int = 8) -> None:
    _card(ax)
    ax.set_axis_off()

    if all_active is None:
        all_active = [
            (SKILL_CATEGORIES[i], profile[i], result.predicted_skills[SKILL_CATEGORIES[i]])
            for i in range(len(SKILL_CATEGORIES))
            if profile[i] >= ACTIVE_THRESHOLD
        ]
        all_active.sort(key=lambda x: x[1], reverse=True)

    total_active = len(all_active)
    n_inactive   = len(SKILL_CATEGORIES) - total_active
    page         = all_active[offset:offset + page_size]
    has_above    = offset > 0
    has_below    = offset + page_size < total_active

    scroll_hint = "  ·  scroll ↑↓ to see all" if total_active > page_size else ""
    _section_label(ax, "Developing Skills",
                   f"Competencies emphasized by this course  ·  {total_active} skills tracked{scroll_hint}")

    if not page:
        ax.text(0.5, 0.5, "No active skills for this course.",
                transform=ax.transAxes, ha='center', va='center',
                color=TEXT_S, fontsize=9)
        return

    if has_above:
        ax.text(0.99, 0.960, "▲ more above",
                transform=ax.transAxes, ha='right', va='top',
                color=NEUTRAL, fontsize=6.5, style='italic')

    row_h = min(0.80 / len(page), 0.105)
    y0    = 0.895

    for i, (skill_name, weight, score) in enumerate(page):
        y      = y0 - i * row_h - row_h * 0.45
        target = weight * 100.0
        pot    = _pct_of_target(score, weight)
        slbl, scol = _status(pot)

        # Full skill name
        ax.text(0.016, y + row_h * 0.28, skill_name,
                transform=ax.transAxes, ha='left', va='center',
                color=TEXT_B, fontsize=8, fontweight='bold')

        # Status badge
        ax.text(0.72, y + row_h * 0.28, slbl,
                transform=ax.transAxes, ha='left', va='center',
                color=scol, fontsize=6.5, fontweight='bold')

        # Track
        bx, bw = 0.016, 0.965
        by = y - row_h * 0.20
        bh = row_h * 0.28
        ax.add_patch(FancyBboxPatch(
            (bx, by), bw, bh,
            boxstyle="round,pad=0.003",
            facecolor=MAIN_BG, edgecolor='none',
            transform=ax.transAxes))

        fw = bw * min(score / 100.0, 1.0)
        if fw > 0.002:
            ax.add_patch(FancyBboxPatch(
                (bx, by), fw, bh,
                boxstyle="round,pad=0.003",
                facecolor=scol, edgecolor='none', alpha=0.82,
                transform=ax.transAxes))

        # Target dashed marker
        tx = bx + bw * min(target / 100.0, 1.0)
        ax.plot([tx, tx], [by, by + bh],
                color=TEXT_S, lw=1.0, ls='--',
                transform=ax.transAxes, alpha=0.7)

        ax.text(bx, by - row_h * 0.08,
                f"Score: {score:.1f}",
                transform=ax.transAxes, ha='left', va='top',
                color=TEXT_S, fontsize=6.5)
        ax.text(bx + bw, by - row_h * 0.08,
                f"Course target: {target:.0f}",
                transform=ax.transAxes, ha='right', va='top',
                color=TEXT_S, fontsize=6.5)

    if has_below:
        remaining = total_active - offset - page_size
        ax.text(0.99, 0.022, f"▼ {remaining} more  ·  scroll down",
                transform=ax.transAxes, ha='right', va='bottom',
                color=NEUTRAL, fontsize=6.5, style='italic')
    elif n_inactive > 0:
        ax.text(0.016, 0.022,
                f"{n_inactive} remaining skills are not emphasized by this course "
                f"and are expected to stay unchanged.",
                transform=ax.transAxes, ha='left', va='bottom',
                color=NEUTRAL, fontsize=7, style='italic')


# ─────────────────────────────────────────────────────────────────────────────
# Progress circles
# ─────────────────────────────────────────────────────────────────────────────
def _draw_circle(ax: plt.Axes, skill_name: str,
                 score: float, weight: float, rank: int) -> None:
    _card(ax)
    ax.set_xlim(-1.3, 1.3)
    ax.set_ylim(-2.1, 1.4)
    ax.set_axis_off()

    pot  = _pct_of_target(score, weight)
    _, c = _status(pot)

    rank_cols = [ACCENT, "#D4561A", WARNING, BLUE]
    rc        = rank_cols[rank % len(rank_cols)]

    # Background ring
    ax.add_patch(Wedge((0, 0), 1.05, 0, 360, width=0.32,
                       facecolor=CARD_BD, edgecolor='none', zorder=1))
    # Progress arc
    theta1 = 90 - (pot / 100.0 * 360)
    ax.add_patch(Wedge((0, 0), 1.05, theta1, 90, width=0.32,
                       facecolor=c, edgecolor='none', zorder=2))
    # Inner
    ax.add_patch(plt.Circle((0, 0), 0.73, color=CARD_BG, zorder=3))

    # Rank dot
    ax.add_patch(plt.Circle((0, 1.20), 0.14, color=rc, zorder=5))
    ax.text(0, 1.20, str(rank + 1), ha='center', va='center',
            color='white', fontsize=7, fontweight='bold', zorder=6)

    # Percentage inside ring
    ax.text(0, 0.12, f"{pot:.0f}%",
            ha='center', va='center',
            color=TEXT_H, fontsize=13, fontweight='bold', zorder=4)
    ax.text(0, -0.28, "of target",
            ha='center', va='center',
            color=TEXT_S, fontsize=6.5, zorder=4)

    # Full skill name below — wrap at 16 chars
    words  = skill_name.split()
    lines  = []
    cur    = ""
    for w in words:
        if len(cur) + len(w) + 1 <= 16:
            cur = (cur + " " + w).strip()
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)

    for li, line in enumerate(lines[:3]):
        ax.text(0, -1.35 - li * 0.28, line,
                ha='center', va='top',
                color=TEXT_B, fontsize=7, fontweight='bold')

    # Status tag
    slbl, _ = _status(pot)
    short_tag = slbl.replace("EXCEEDING EXPECTATIONS", "EXCEEDING").replace(
        "NEEDS ATTENTION", "NEEDS ATTN")
    ax.text(0, -2.05, short_tag,
            ha='center', va='top',
            color=c, fontsize=5.5, fontweight='bold')


# ─────────────────────────────────────────────────────────────────────────────
# Summary bar – Top / Weak / Accuracy
# ─────────────────────────────────────────────────────────────────────────────
def _draw_summary(ax: plt.Axes, result: PredictionResult,
                  profile: np.ndarray, metrics: dict) -> None:
    _card(ax)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_axis_off()

    skills = result.predicted_skills
    active = {s: v for s, v in skills.items()
              if profile[SKILL_CATEGORIES.index(s)] >= ACTIVE_THRESHOLD}
    if not active:
        active = skills

    sorted_a = sorted(active.items(), key=lambda kv: kv[1], reverse=True)
    top3     = sorted_a[:3]
    bot3     = sorted_a[-3:]

    cv_r2  = metrics.get("skills_regression", {}).get("cv_r2_mean", None)
    cv_std = metrics.get("skills_regression", {}).get("cv_r2_std", None)

    W = 0.31
    G = 0.025

    # ── Col 1: Top skills ─────────────────────────────────────────────────
    ax.text(0.015, 0.94, "Top Skills",
            transform=ax.transAxes, ha='left', va='top',
            color=SUCCESS, fontsize=8.5, fontweight='bold')
    for i, (sk, val) in enumerate(top3):
        ax.text(0.020, 0.73 - i * 0.22, f"+ {sk}",
                transform=ax.transAxes, ha='left', va='top',
                color=TEXT_B, fontsize=7.5)
        ax.text(W - 0.01, 0.73 - i * 0.22, f"{val:.1f}",
                transform=ax.transAxes, ha='right', va='top',
                color=SUCCESS, fontsize=7.5, fontweight='bold')

    ax.plot([W + G, W + G], [0.05, 0.95],
            color=CARD_BD, lw=1, transform=ax.transAxes)

    # ── Col 2: Needs improvement ──────────────────────────────────────────
    x2 = W + G * 2
    ax.text(x2, 0.94, "Needs Improvement",
            transform=ax.transAxes, ha='left', va='top',
            color=DANGER, fontsize=8.5, fontweight='bold')
    for i, (sk, val) in enumerate(list(reversed(bot3))):
        ax.text(x2 + 0.005, 0.73 - i * 0.22, f"- {sk}",
                transform=ax.transAxes, ha='left', va='top',
                color=TEXT_B, fontsize=7.5)
        ax.text(x2 + W - 0.01, 0.73 - i * 0.22, f"{val:.1f}",
                transform=ax.transAxes, ha='right', va='top',
                color=DANGER, fontsize=7.5, fontweight='bold')

    ax.plot([W * 2 + G * 3, W * 2 + G * 3], [0.05, 0.95],
            color=CARD_BD, lw=1, transform=ax.transAxes)

    # ── Col 3: Model accuracy ─────────────────────────────────────────────
    x3 = W * 2 + G * 4
    ax.text(x3, 0.94, "Model Accuracy",
            transform=ax.transAxes, ha='left', va='top',
            color=TEXT_H, fontsize=8.5, fontweight='bold')
    if cv_r2 is not None:
        ax.text(x3, 0.62, f"{cv_r2 * 100:.1f}%",
                transform=ax.transAxes, ha='left', va='center',
                color=ACCENT, fontsize=17, fontweight='bold')
        ax.text(x3, 0.34, f"5-Fold CV R\u00b2  \u00b1{cv_std * 100:.2f}%",
                transform=ax.transAxes, ha='left', va='center',
                color=TEXT_S, fontsize=7)
        ax.text(x3, 0.14, "GradientBoosting Model",
                transform=ax.transAxes, ha='left', va='center',
                color=TEXT_S, fontsize=6.5, style='italic')
    else:
        ax.text(x3, 0.50, "N/A", transform=ax.transAxes,
                ha='left', va='center', color=TEXT_S, fontsize=10)


# ─────────────────────────────────────────────────────────────────────────────
# Skill Trend
# ─────────────────────────────────────────────────────────────────────────────
def _draw_trend(ax: plt.Axes, result: PredictionResult,
                profile: np.ndarray) -> Tuple[List[str], np.ndarray, np.ndarray]:
    _card(ax)

    active = [SKILL_CATEGORIES[i] for i in range(len(SKILL_CATEGORIES))
              if profile[i] >= ACTIVE_THRESHOLD]
    if not active:
        ax.text(0.5, 0.5, "No active skills for trend analysis.",
                transform=ax.transAxes, ha='center', va='center',
                color=TEXT_S)
        return [], np.array([]), np.array([])

    x         = np.arange(len(active))
    cur_vals  = np.array([result.predicted_skills[s] for s in active])
    low_vals  = np.array([result.scenario_low.get(s, 0)  for s in active])
    high_vals = np.array([result.scenario_high.get(s, 0) for s in active])

    ax.set_facecolor(CARD_BG)
    for sp in ax.spines.values():
        sp.set_edgecolor(CARD_BD)
        sp.set_linewidth(0.8)

    # Shaded range between low and high
    ax.fill_between(x, low_vals, high_vals,
                    color=ACCENT, alpha=0.07, zorder=1, label="_nolegend_")

    ax.plot(x, low_vals,  "o--", color=NEUTRAL,  lw=1.6, ms=4.5, zorder=2,
            label="Low scenario  —  If all ILOs were ~70% (struggling student)")
    ax.plot(x, cur_vals,  "o-",  color=ACCENT,   lw=2.4, ms=6,   zorder=4,
            label="Current  —  This student's actual ILO scores")
    ax.plot(x, high_vals, "o--", color=SUCCESS,  lw=1.6, ms=4.5, zorder=3,
            label="High scenario  —  If all ILOs were ~90% (excellent student)")

    # Annotate current values
    for xi, val in zip(x, cur_vals):
        ax.annotate(f"{val:.0f}",
                    xy=(xi, val), xytext=(0, 7),
                    textcoords='offset points',
                    ha='center', fontsize=6.5,
                    color=ACCENT, fontweight='bold')

    ax.set_xticks(x)
    ax.set_xticklabels(active, rotation=35, ha='right',
                       fontsize=7.5, color=TEXT_B)
    ax.set_ylabel("Predicted Skill Score (0–100)", color=TEXT_S, fontsize=8)
    ax.tick_params(colors=TEXT_S, labelsize=7.5)
    ax.grid(axis='y', color=CARD_BD, lw=0.8, ls='--', alpha=0.8)
    ax.grid(axis='x', color=CARD_BD, lw=0.5, ls=':',  alpha=0.5)
    ax.set_ylim(bottom=0)

    ax.set_title(
        "Skill Trajectory Analysis  —  Course-Active Skills Only",
        fontsize=9.5, fontweight='bold', color=TEXT_H, pad=8, loc='left')

    # Legend with bigger font for clarity
    ax.legend(facecolor=CARD_BG, edgecolor=CARD_BD,
              labelcolor=TEXT_B, fontsize=8,
              loc='upper left', framealpha=0.95)

    # Insight note
    best_i  = int(np.argmax(cur_vals))
    worst_i = int(np.argmin(cur_vals))
    gap     = float(high_vals[best_i] - low_vals[best_i])
    note = (
        f"Insight:  {active[best_i]}  shows the highest projected score for this student.  "
        f"|  {active[worst_i]}  has the most room for improvement.  "
        f"|  Score range across scenarios: {gap:.1f} pts"
    )
    ax.text(0.01, 0.015, note,
            transform=ax.transAxes, ha='left', va='bottom',
            color=TEXT_S, fontsize=7, style='italic')

    return active, x, cur_vals


# ─────────────────────────────────────────────────────────────────────────────
# Interactive helpers (hover + scroll) – only wired up when plt.show() is used
# ─────────────────────────────────────────────────────────────────────────────

def _setup_hover(fig: plt.Figure, ax: plt.Axes,
                 active: List[str], x: np.ndarray, cur_vals: np.ndarray) -> None:
    """Attach a hover annotation to the trajectory chart."""
    if not len(active):
        return

    annot = ax.annotate(
        "", xy=(0, 0), xytext=(14, 14),
        textcoords="offset points",
        bbox=dict(boxstyle="round,pad=0.45", fc=CARD_BG, ec=ACCENT, lw=1.2),
        arrowprops=dict(arrowstyle="->", color=ACCENT, lw=1.0),
        fontsize=8.5, color=TEXT_H, zorder=10,
    )
    annot.set_visible(False)

    def on_hover(event: matplotlib.backend_bases.MouseEvent) -> None:
        if event.inaxes != ax:
            if annot.get_visible():
                annot.set_visible(False)
                fig.canvas.draw_idle()
            return
        hit = False
        for xi, val, skill in zip(x, cur_vals, active):
            try:
                xd, yd = ax.transData.transform((float(xi), float(val)))
            except Exception:
                continue
            if abs(event.x - xd) < 14 and abs(event.y - yd) < 14:
                annot.xy = (float(xi), float(val))
                annot.set_text(f"{skill}\n{val:.1f}")
                annot.set_visible(True)
                fig.canvas.draw_idle()
                hit = True
                break
        if not hit and annot.get_visible():
            annot.set_visible(False)
            fig.canvas.draw_idle()

    fig.canvas.mpl_connect('motion_notify_event', on_hover)


def _setup_skill_scroll(fig: plt.Figure, ax: plt.Axes,
                        result: PredictionResult, profile: np.ndarray,
                        all_active: List, page_size: int = 8) -> None:
    """Wire mouse-wheel scrolling on the Developing Skills panel."""
    state = {"offset": 0}

    def _redraw() -> None:
        ax.cla()
        _draw_skills(ax, result, profile, all_active, state["offset"], page_size)
        fig.canvas.draw_idle()

    def on_scroll(event: matplotlib.backend_bases.MouseEvent) -> None:
        if event.inaxes != ax:
            return
        max_off = max(0, len(all_active) - page_size)
        if event.button == 'up':
            state["offset"] = max(0, state["offset"] - 1)
        else:
            state["offset"] = min(max_off, state["offset"] + 1)
        _redraw()

    fig.canvas.mpl_connect('scroll_event', on_scroll)


# ─────────────────────────────────────────────────────────────────────────────
# Main render
# ─────────────────────────────────────────────────────────────────────────────
def render_dashboard(
    result:       PredictionResult,
    metrics:      dict,
    student_name: str = "Student",
    ilo_raw:      Optional[List[float]] = None,
    ilo_totals:   Optional[List[float]] = None,
    save_path:    Optional[Path] = None,
    show:         bool = True,
) -> None:
    matplotlib.rcParams.update({
        "font.family":        "sans-serif",
        "font.sans-serif":    ["Segoe UI", "Arial", "DejaVu Sans"],
        "axes.unicode_minus": False,
        "toolbar":            "None",
    })

    if ilo_raw is None or ilo_totals is None:
        ilo_raw    = [result.ilo1, result.ilo2, result.ilo3, result.ilo4]
        ilo_totals = [100.0, 100.0, 100.0, 100.0]

    profile      = _get_profile(result.course)
    active_skills = [
        (SKILL_CATEGORIES[i], profile[i], result.predicted_skills[SKILL_CATEGORIES[i]])
        for i in range(len(SKILL_CATEGORIES))
        if profile[i] >= ACTIVE_THRESHOLD
    ]
    active_skills.sort(key=lambda x: x[1], reverse=True)
    top4 = active_skills[:4]

    # ── Figure ────────────────────────────────────────────────────────────
    fig = plt.figure(figsize=(26, 20), facecolor=MAIN_BG, dpi=110)

    G   = 0.010   # gap
    L   = 0.015   # left margin
    R   = 0.985   # right edge
    CW  = R - L   # total content width

    # Row positions  (left, bottom, width, height)
    HDR  = (L,           0.920, CW,           0.068)
    # 4 stat cards
    sw   = (CW - 3 * G) / 4
    S1   = (L + 0*(sw+G), 0.818, sw, 0.090)
    S2   = (L + 1*(sw+G), 0.818, sw, 0.090)
    S3   = (L + 2*(sw+G), 0.818, sw, 0.090)
    S4   = (L + 3*(sw+G), 0.818, sw, 0.090)
    # Middle: donut | skills
    DW   = CW * 0.34
    SKW  = CW - DW - G
    DON  = (L,        0.450, DW,  0.355)
    SKL  = (L+DW+G,   0.450, SKW, 0.355)
    # Circle row | summary
    CIRC_TOP = 0.440  # bottom of mid row
    CIR_H    = 0.150
    CIR_B    = CIRC_TOP - CIR_H - G * 2
    cw4      = (CW * 0.36 - 3 * G) / 4
    SUMX     = L + CW * 0.36 + G * 2
    SUMW     = CW - CW * 0.36 - G * 2
    # Trend
    TRD_H    = 0.230
    TRD_B    = CIR_B - TRD_H - G * 2

    ax_hdr  = fig.add_axes(HDR)
    ax_s1   = fig.add_axes(S1)
    ax_s2   = fig.add_axes(S2)
    ax_s3   = fig.add_axes(S3)
    ax_s4   = fig.add_axes(S4)
    ax_don  = fig.add_axes(DON)
    ax_skl  = fig.add_axes(SKL)

    circ_axes = [
        fig.add_axes([L + i*(cw4+G), CIR_B, cw4, CIR_H])
        for i in range(4)
    ]
    ax_sum  = fig.add_axes([SUMX, CIR_B, SUMW, CIR_H])
    ax_trd  = fig.add_axes([L, TRD_B, CW, TRD_H])

    # ── Draw ─────────────────────────────────────────────────────────────
    _draw_header(ax_hdr, student_name, result.course, result.outcome_label)

    ilo_avg   = result.ilo_avg
    n_active  = len(active_skills)
    cv_r2_val = metrics.get("skills_regression", {}).get("cv_r2_mean", 0)

    _draw_stat_card(ax_s1, "Overall Performance",
                    f"{ilo_avg:.1f}%", "Weighted ILO average", ACCENT)
    _draw_stat_card(ax_s2, "Skill Achievement",
                    f"{result.predicted_skills[result.strongest_skill]:.1f}",
                    f"Best: {result.strongest_skill}", SUCCESS)
    _draw_stat_card(ax_s3, "Skills Tracked",
                    f"{n_active}", f"of {len(SKILL_CATEGORIES)} total", BLUE)
    _draw_stat_card(ax_s4, "Model Accuracy",
                    f"{cv_r2_val * 100:.1f}%", "5-Fold CV R\u00b2", PURPLE)

    _draw_donut(ax_don, result, ilo_raw, ilo_totals)
    _draw_skills(ax_skl, result, profile, all_active=active_skills)

    # Section label above circles
    fig.text(L, CIR_B + CIR_H + G + 0.010,
             "Excelled Skills  —  Top course-active competencies",
             ha='left', va='bottom',
             color=TEXT_H, fontsize=9, fontweight='bold')

    for i, ax_c in enumerate(circ_axes):
        if i < len(top4):
            sn, wt, sc = top4[i]
            _draw_circle(ax_c, sn, sc, wt, i)
        else:
            ax_c.set_facecolor(CARD_BG)
            ax_c.set_axis_off()

    _draw_summary(ax_sum, result, profile, metrics)
    trend_active, trend_x, trend_vals = _draw_trend(ax_trd, result, profile)

    # ── Interactive features (skipped in save-only mode) ──────────────────
    if show:
        _setup_hover(fig, ax_trd, trend_active, trend_x, trend_vals)
        _setup_skill_scroll(fig, ax_skl, result, profile, active_skills)

    # ── Footer ────────────────────────────────────────────────────────────
    fig.text(0.50, 0.008,
             "ASPIRE  \u2013  Academic Student Performance Intelligence & Reporting Engine  "
             "|  BS Computer Engineering  |  ILO-Based Skill Forecasting",
             ha='center', va='bottom', color=TEXT_S, fontsize=7)

    plt.subplots_adjust(left=0, right=1, top=1, bottom=0)

    if save_path:
        plt.savefig(save_path, dpi=130, bbox_inches='tight',
                    facecolor=MAIN_BG)
        print(f"Dashboard saved : {save_path}")

    if show:
        plt.show()

    plt.close(fig)
