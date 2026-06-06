"""
scoring.py — Deterministic career match + skill fusion scoring.

Replaces LLM-computed numbers (match_score in Career Mapper, final_score /
status / summary counts in Skill Synthesizer) with Python computations.
Same inputs → same outputs, every time.

The agents still do what LLMs are good at: skill identification, alias
resolution, domain classification, and adjacency judgments. But arithmetic
and threshold banding run here, in code.
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
    "html5": "html",
    "css3": "css",
    "c++": "cpp",
    "c/c++": "cpp",
    "c#": "csharp",
    "aws": "amazon web services",
    "gcp": "google cloud",
    "google cloud platform": "google cloud",
    "pytorch": "pytorch",
    "llm": "llms",
    "large language models": "llms",
    "db": "database",
    "dbs": "database",
    "vector dbs": "vector databases",
    "feature eng.": "feature engineering",
}

# Maps required-skill keyword (lowercase, canonicalized) to alternative skill names in profile (lowercase, canonicalized).
SKILL_REQUIREMENT_ALIASES: dict[str, list[str]] = {
    "machine learning":  ["machine learning", "data mining", "ml"],
    "python":            ["python", "programming fundamentals", "computer programming", "object-oriented programming"],
    "scikit-learn":      ["scikit-learn", "machine learning", "data mining"],
    "feature engineering": ["feature engineering", "data mining"],
    "pandas":            ["pandas", "data mining"],
    "sql":               ["sql", "database", "postgresql"],
    "statistics":        ["statistics", "engineering data analysis", "numerical analysis"],
    "linux":             ["linux", "os concepts", "operating systems"],
    "rest":              ["rest", "api", "software design", "backend", "design patterns"],
    "rest apis":         ["rest", "api", "software design", "backend", "rest apis", "design patterns"],
    "system design":     ["system design", "software architecture", "design patterns"],
    "distributed systems": ["distributed systems", "system design", "networking"],
    "distributed":       ["distributed", "system design", "networking"],
    "security":          ["network security", "cybersecurity", "security"],
    "software architecture": ["software architecture", "system design", "computer architecture"],
    "architecture":      ["software architecture", "system design", "computer architecture"],
    "javascript":        ["javascript", "web", "frontend", "programming fundamentals", "computer programming"],
    "react":             ["react", "javascript", "frontend"],
    "data":              ["data mining", "data"],
    "git":               ["git"],
    "html":              ["html", "web", "frontend"],
    "css":               ["css", "web", "frontend"],
    "cpp":               ["cpp", "programming fundamentals", "computer programming", "object-oriented programming"],
    "c":                 ["c", "programming fundamentals", "computer programming", "object-oriented programming"],
    "microcontrollers":  ["microcontrollers", "microprocessor architecture", "embedded systems"],
    "rtos":              ["rtos", "operating systems", "os concepts"],
    "pcb design basics": ["pcb design basics", "pcb design", "cad", "circuit analysis"],
    "pcb design":        ["pcb design", "cad", "circuit analysis"],
    "debugging with oscilloscopes": ["debugging with oscilloscopes", "circuit analysis", "electronic devices"],
    "i2c/spi/uart protocols": ["i2c/spi/uart protocols", "microprocessor architecture", "embedded systems"],
    "hdl":               ["verilog", "hdl", "introduction to hdl", "vhdl"],
    "digital signal processing": ["dsp algorithms", "digital signal processing", "dsp"],
    "sensors":           ["sensor technology", "sensors"],
    "embedded c":        ["c", "cpp", "programming fundamentals", "computer programming", "object-oriented programming", "microprocessor architecture"],
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
    # Strip any trailing parenthetical context (e.g. "RTOS (FreeRTOS/Zephyr)" -> "RTOS")
    s = skill.split("(")[0].strip().lower()
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


def build_skill_index(unified_skills: list[dict]) -> dict[str, str]:
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


def evaluate_career_skills(
    required_skills: list[str],
    skill_index: dict[str, str],
) -> tuple[list[str], list[str]]:
    """
    Partition required skills into matched and gap lists based on student skill_index and aliases.
    """
    matched = []
    gaps = []
    for req in required_skills:
        req_canon = canonicalize(req)
        # Check aliases
        candidates = SKILL_REQUIREMENT_ALIASES.get(req_canon, [req_canon])
        has_match = False
        for cand in candidates:
            if skill_index.get(canonicalize(cand)) is not None:
                has_match = True
                break
        if has_match:
            matched.append(req)
        else:
            gaps.append(req)
    return matched, gaps


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
        # Handle composite skills like "Python / JS" or "AWS / GCP"
        # Split by / or | and take the max proficiency among the options
        options = [s.strip() for s in skill.replace('|', '/').split('/') if s.strip()]
        best_prof_points = 0.0
        
        for opt in options:
            opt_canon = canonicalize(opt)
            
            # 1. Direct match check (gets 100% of grade-based points)
            prof = skill_index.get(opt_canon)
            if prof:
                opt_points = PROFICIENCY_POINTS.get(prof, 0.0)
                if opt_points > best_prof_points:
                    best_prof_points = opt_points
            else:
                # 2. Indirect/alias match check (gets 70% of grade-based points as it is a broad foundational class)
                candidates = SKILL_REQUIREMENT_ALIASES.get(opt_canon, [])
                for cand in candidates:
                    prof = skill_index.get(canonicalize(cand))
                    if prof:
                        opt_points = PROFICIENCY_POINTS.get(prof, 0.0) * 0.7
                        if opt_points > best_prof_points:
                            best_prof_points = opt_points
                    
        points += best_prof_points

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

    skill_index = build_skill_index(unified_skills)
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


# ── Unified-skill fusion (Agent 3 override) ──────────────────────────────────

# Hardware/embedded keyword guard. The LLM is asked to flag these skills, but
# we also check here so the 100%-academic fallback fires even if the LLM's
# domain tag drifts. Compared case-insensitively against skill name + category.
_HARDWARE_KEYWORDS: frozenset[str] = frozenset({
    "hardware", "embedded", "circuit", "signal", "microprocessor", "vlsi",
    "fpga", "iot", "hdl", "verilog", "vhdl", "systemverilog", "firmware",
    "pcb", "rtos", "microcontroller", "stm32", "esp32", "arm", "risc-v",
    "asic", "sensor", "analog", "digital logic", "cmos", "oscilloscope",
})

# Fusion weights — uniform 60/40 across domains. Hardware skills with no
# GitHub presence fall back to 100% academic via the academic-only branch
# below, so they aren't punished by a missing GitHub signal.
DEFAULT_ACADEMIC_WEIGHT: float = 0.6
DEFAULT_GITHUB_WEIGHT: float = 0.4

# Status thresholds — mirror what the prompt previously asked the LLM to apply.
_EXCEEDING_THRESHOLD: int = 80
_ON_TRACK_THRESHOLD: int = 60
_NEEDS_ATTENTION_THRESHOLD: int = 40


def _is_hardware_skill(name: str | None, category: str | None) -> bool:
    haystack = f"{name or ''} {category or ''}".lower()
    return any(kw in haystack for kw in _HARDWARE_KEYWORDS)


def _status_from_score(score: float) -> str:
    if score >= _EXCEEDING_THRESHOLD:
        return "EXCEEDING EXPECTATIONS"
    if score >= _ON_TRACK_THRESHOLD:
        return "ON TRACK"
    if score >= _NEEDS_ATTENTION_THRESHOLD:
        return "NEEDS ATTENTION"
    return "CRITICAL"


def _coerce_score(value: Any) -> float | None:
    """Return a numeric score (float) or None when the LLM emitted null/garbage."""
    if isinstance(value, bool):  # bool is a subclass of int — explicit reject.
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _recompute_one(skill: dict) -> dict | None:
    """
    Apply the 60/40 default (or 100/0 academic-only fallback) to one skill record.

    Returns the enriched dict, or None if the record has neither an academic
    nor a usable GitHub score — those can't be scored at all.
    """
    name = skill.get("skill")
    if not name:
        return None

    category = skill.get("category")
    acad = _coerce_score(skill.get("academic_score"))
    gh = _coerce_score(skill.get("github_score"))

    is_hw = _is_hardware_skill(name, category)

    if acad is not None and gh is not None and gh > 0:
        # Default 60/40 — applies to all domains uniformly, including hardware
        # skills that DO show up in a repo (Arduino/Verilog/STM32 projects).
        acad_w, gh_w = DEFAULT_ACADEMIC_WEIGHT, DEFAULT_GITHUB_WEIGHT
        final: float = acad_w * acad + gh_w * gh
        source = "both"
    elif acad is not None:
        # Hardware-without-repo fallback lives here naturally: no GitHub score
        # means academic carries 100%. Software skills with academic-only data
        # land here too, which is fine — same math.
        acad_w, gh_w = 1.0, 0.0
        final = acad
        source = "academic"
    elif gh is not None and gh > 0:
        # GitHub-only (rare — skill in repo but ungraded academically).
        acad_w, gh_w = 0.0, 1.0
        final = gh
        source = "github"
    else:
        return None

    enriched = dict(skill)
    enriched["final_score"] = round(final, 1)
    enriched["status"] = _status_from_score(final)
    enriched["source"] = source
    enriched["fusion_weights"] = {"academic": acad_w, "github": gh_w}
    # Mark hardware-fallback cases so reviewers can see why the weight changed.
    if is_hw and source == "academic":
        enriched["weighting_note"] = "hardware fallback — no GitHub presence"
    return enriched


def recompute_unified_skills(unified_skills: list[dict]) -> dict:
    """
    Deterministic post-processor for Agent 3's `unified_skills`.

    The LLM still does the work it's good at (skill identification, alias
    resolution, category assignment, raw academic_score / github_score
    extraction). This function then applies the fusion math, status bands,
    and summary counts in pure Python so identical inputs always produce
    identical outputs.

    Returns a dict with the keys consumers already expect:
        unified_skills, skill_summary, strongest_skills, weakest_skills
    """
    cleaned: list[dict] = []
    for entry in unified_skills or []:
        if not isinstance(entry, dict):
            continue
        recomputed = _recompute_one(entry)
        if recomputed is not None:
            cleaned.append(recomputed)

    summary = {
        "total_skills": len(cleaned),
        "exceeding": sum(1 for s in cleaned if s["status"] == "EXCEEDING EXPECTATIONS"),
        "on_track": sum(1 for s in cleaned if s["status"] == "ON TRACK"),
        "needs_attention": sum(1 for s in cleaned if s["status"] == "NEEDS ATTENTION"),
        "critical": sum(1 for s in cleaned if s["status"] == "CRITICAL"),
    }

    # Tie-break order: higher score first, then prefer "both" source, then
    # alphabetic name so ordering is stable across runs.
    _source_rank = {"both": 0, "github": 1, "academic": 2}
    by_score = sorted(
        cleaned,
        key=lambda s: (
            -s["final_score"],
            _source_rank.get(s.get("source"), 9),
            s["skill"],
        ),
    )
    strongest = [s["skill"] for s in by_score[:3]]
    # Weakest uses ascending order: lowest score first.
    by_score_asc = sorted(
        cleaned,
        key=lambda s: (
            s["final_score"],
            _source_rank.get(s.get("source"), 9),
            s["skill"],
        ),
    )
    weakest = [s["skill"] for s in by_score_asc[:3]]

    return {
        "unified_skills": cleaned,
        "skill_summary": summary,
        "strongest_skills": strongest,
        "weakest_skills": weakest,
    }
