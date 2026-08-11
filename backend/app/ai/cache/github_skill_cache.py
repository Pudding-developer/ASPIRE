"""
github_skill_cache.py — Read/write helpers for the GithubSkillCache table.

Agent 1 (GitHub Analyzer) produces wildly different skill counts on each run
(55 vs 148 vs 155 skills observed from the same repos) because it runs with a
non-zero temperature. This module caches Agent 1's output keyed on a SHA-256
hash of the raw GitHub repo/contribution data. If the data hasn't changed,
the cached result is returned directly and Agent 1 is skipped.

Sync helpers only — crew.py runs in a thread via asyncio.to_thread().
"""
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.github_skill_cache import GithubSkillCache

logger = logging.getLogger(__name__)


# ── Hashing ──────────────────────────────────────────────────────────────────

def hash_github_data(github_data: dict) -> str:
    """
    SHA-256 of the student's serialized github_profile block.

    The hash covers repos (languages, dependencies, commit count, pushed_at),
    contributions (total_commits, calendar), and the github_username.
    Changes to any of these invalidate the cache.
    """
    try:
        # Sort keys for deterministic serialization
        serialized = json.dumps(github_data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()
    except Exception:
        # If serialization fails for any reason, return a unique-ish value
        # so the cache always misses (safe fallback — just re-extracts).
        return hashlib.sha256(str(github_data).encode()).hexdigest()


# ── Read ─────────────────────────────────────────────────────────────────────

def get_cached_github_skills(
    student_id: int,
    data_hash: str,
    db: Session,
) -> dict | None:
    """
    Returns cached Agent 1 output if data_hash matches the stored hash.
    Returns None if no cache row exists or the hash has changed.
    """
    try:
        row = db.execute(
            select(GithubSkillCache).where(GithubSkillCache.student_id == student_id)
        ).scalar_one_or_none()

        if row is None:
            logger.info("[github_cache] Cache MISS — no row for student_id=%s", student_id)
            return None

        if row.data_hash != data_hash:
            logger.info(
                "[github_cache] Cache MISS — hash changed for student_id=%s "
                "(stored=%s new=%s)",
                student_id, row.data_hash[:8], data_hash[:8],
            )
            return None

        if not row.github_skills:
            logger.info("[github_cache] Cache MISS — empty skills for student_id=%s", student_id)
            return None

        skills = json.loads(row.github_skills)
        logger.info(
            "[github_cache] Cache HIT — reusing %d skills for student_id=%s (hash=%s)",
            len(skills.get("github_skills", [])), student_id, data_hash[:8],
        )
        return skills

    except Exception as exc:
        logger.warning("[github_cache] Read error for student_id=%s: %s — will re-extract", student_id, exc)
        return None


# ── Write ─────────────────────────────────────────────────────────────────────

def save_github_skills(
    student_id: int,
    data_hash: str,
    skills: dict,
    db: Session,
) -> None:
    """
    Upserts the cache row after a fresh Agent 1 extraction.

    skills should be the dict returned by Agent 1 — typically
    {"github_skills": [...], "github_summary": {...}}.
    """
    try:
        skills_json = json.dumps(skills, default=str)
        now = datetime.now(timezone.utc)

        row = db.execute(
            select(GithubSkillCache).where(GithubSkillCache.student_id == student_id)
        ).scalar_one_or_none()

        if row is None:
            row = GithubSkillCache(
                student_id=student_id,
                data_hash=data_hash,
                github_skills=skills_json,
                created_at=now,
                updated_at=now,
            )
            db.add(row)
        else:
            row.data_hash = data_hash
            row.github_skills = skills_json
            row.updated_at = now

        db.commit()
        logger.info(
            "[github_cache] Saved %d skills for student_id=%s (hash=%s)",
            len(skills.get("github_skills", [])), student_id, data_hash[:8],
        )
    except Exception as exc:
        logger.warning("[github_cache] Write error for student_id=%s: %s — cache not saved", student_id, exc)
        with open('/tmp/err.log', 'a') as f:
            f.write(f"Cache write error: {exc}\n")
        try:
            db.rollback()
        except Exception:
            pass
