"""
scoring.py — Deterministic career match scoring.

Replaces the LLM-computed match_score in the Career Mapper agent's output
with a Python computation. Same inputs → same outputs, every time.

The agent still does what LLMs are good at: identifying which student skills
match each career's required skills (including alias resolution and adjacent
skill judgments). But the actual scoring math runs here, in code.
"""
from typing import Any

# ── Constants ────────────────────────────────────────────────────────────────

# Lowercase canonical aliases. Add entries as the team discovers more.
SKILL_ALIASES: dict[str, str] = {
    "postgres": "postgresql",
    "js": "javascript",
    "ts": "typescript",
    "k8s": "kubernetes",
    "oop": "object-oriented programming",
    "node": "node.js",
    "nodejs": "node.js",
    "py": "python",
    "next": "next.js",
    "nextjs": "next.js",
    "react.js": "react",
    "reactjs": "react",
    "vue.js": "vue",
    "vuejs": "vue",
    "ml": "machine learning",
    "ai": "artificial intelligence",
    "ci/cd": "ci-cd",
    "tf": "tensorflow",
    "psql": "postgresql",
}

# Proficiency → points (must match what the LLM was asked to use)
PROFICIENCY_POINTS: dict[str, float] = {
    "advanced": 1.0,
    "intermediate": 0.7,
    "beginner": 0.4,
}

GITHUB_BONUS = 5
SCORE_FLOOR = 0  # below this -> drop the career
SCORE_CAP = 95    # never give a perfect 100


# ── Core helpers ─────────────────────────────────────────────────────────────

def canonicalize(skill: str | None) -> str:
    """Normalize a skill name to its canonical form (lowercase, dealiased)."""
    if not skill:
        return ""
    s = skill.strip().lower()
    return SKILL_ALIASES.get(s, s)


def _proficiency_from_status(status: str | None, final_score: float | None) -> str | None:
    """
    Map the Skill Synthesizer's status/final_score onto our 3-bucket proficiency.

    Falls back to final_score if status is missing or unrecognized.
    Returns None for skills the student doesn't really have (CRITICAL, score < 40).
    """
    if status:
        s = status.upper().strip()
        if "EXCEEDING" in s or "ADVANCED" in s:
            return "advanced"
        if "ON TRACK" in s or "INTERMEDIATE" in s:
            return "intermediate"
        if "NEEDS ATTENTION" in s or "BEGINNER" in s:
            return "beginner"
        if "CRITICAL" in s:
            return None
    # Fallback: bucket by numeric score
    if final_score is None:
        return None
    if final_score >= 80:
        return "advanced"
    if final_score >= 60:
        return "intermediate"
    if final_score >= 40:
        return "beginner"
    return None


def _build_skill_index(unified_skills: list[dict]) -> dict[str, str]:
    """
    Build a map: canonical skill name → proficiency bucket.

    unified_skills comes from the Skill Synthesizer (Agent 3); each entry has
    'skill', 'status', 'final_score' fields.
    """
    index: dict[str, str] = {}
    for entry in unified_skills or []:
        if not isinstance(entry, dict):
            continue
        name = canonicalize(entry.get("skill"))
        if not name:
            continue
        prof = _proficiency_from_status(
            entry.get("status"),
            entry.get("final_score") if isinstance(entry.get("final_score"), (int, float)) else None,
        )
        if prof is None:
            continue
        # If duplicate canonical entries appear (alias collision), keep highest tier.
        existing = index.get(name)
        if existing is None or _tier(prof) > _tier(existing):
            index[name] = prof
    return index


def _tier(prof: str) -> int:
    return {"advanced": 3, "intermediate": 2, "beginner": 1}.get(prof, 0)


def _extract_skill_name(item: Any) -> str:
    """matched_skills/gap_skills entries can be strings or dicts; normalize."""
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return item.get("name") or item.get("skill") or ""
    return ""


# ── Scoring ──────────────────────────────────────────────────────────────────

def compute_match_score(
    matched_skills: list,
    gap_skills: list,
    skill_index: dict[str, str],
    has_github_bonus: bool = False,
) -> int:
    """
    Compute a deterministic match score for one career.

    matched_skills + gap_skills together = the career's required skills.
    skill_index = canonical skill name → proficiency bucket (built once for student).
    """
    required: list[str] = []
    seen: set[str] = set()
    for raw in (matched_skills or []) + (gap_skills or []):
        canon = canonicalize(_extract_skill_name(raw))
        if canon and canon not in seen:
            seen.add(canon)
            required.append(canon)

    if not required:
        return 0

    points = 0.0
    for skill in required:
        prof = skill_index.get(skill)
        if prof:
            points += PROFICIENCY_POINTS.get(prof, 0.0)
        # else: not present → 0 pts

    raw = (points / len(required)) * 100
    if has_github_bonus:
        raw += GITHUB_BONUS
    score = round(raw)

    if score < SCORE_FLOOR:
        return 0
    return min(score, SCORE_CAP)


def recompute_career_matches(
    career_matches: list[dict],
    unified_skills: list[dict],
) -> list[dict]:
    """
    Replace LLM-computed match_scores with deterministic Python-computed ones.
    Re-sorts by the new score; drops careers below the floor.

    Preserves all other fields verbatim (matched_skills, gap_skills, reasoning,
    roadmap_url) since those are LLM judgments we still trust.
    """
    if not career_matches:
        return []

    skill_index = _build_skill_index(unified_skills)
    rescored: list[dict] = []

    for career in career_matches:
        if not isinstance(career, dict):
            continue
        # Heuristic for the +5 bonus: if the LLM's reasoning mentions a github
        # project as evidence, honor it. Otherwise no bonus. This keeps us
        # deterministic per (matched_skills, reasoning) without re-judging.
        reasoning = (career.get("reasoning") or "").lower()
        has_bonus = ("github" in reasoning and "project" in reasoning) or \
                    ("repo" in reasoning and any(p in reasoning for p in ["matches", "demonstrate", "shows"]))

        new_score = compute_match_score(
            matched_skills=career.get("matched_skills", []),
            gap_skills=career.get("gap_skills", []),
            skill_index=skill_index,
            has_github_bonus=has_bonus,
        )
        updated = dict(career)
        updated["match_score"] = new_score
        rescored.append(updated)

    rescored.sort(key=lambda c: -c.get("match_score", 0))
    return rescored
