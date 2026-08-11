"""
academic_skill_cache.py — Read/write helpers for the AcademicSkillCache table.

Agent 2 (Academic Analyzer) maps a student's ILO scores to real-world skills.
This module caches Agent 2's output keyed on a SHA-256 hash of the academic
scores list. If the grades haven't changed, the cached result is returned
directly and Agent 2 is skipped — cutting pipeline time in half for students
whose grades haven't changed since the last run.

Sync helpers only — crew.py runs in a thread via asyncio.to_thread().
"""
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.academic_skill_cache import AcademicSkillCache

logger = logging.getLogger(__name__)


# ── Hashing ──────────────────────────────────────────────────────────────────

def hash_academic_data(academic_scores: list) -> str:
    """
    SHA-256 of the student's serialized academic_scores list.

    The hash covers subject_name, ilo_number, score, and max_score for every
    row. A new grade or a changed score invalidates the cache.
    """
    try:
        # Only hash the fields that actually affect Agent 2's output
        stable = [
            {
                "subject_name": s.get("subject_name"),
                "ilo_number": s.get("ilo_number"),
                "score": s.get("score"),
                "max_score": s.get("max_score"),
            }
            for s in (academic_scores or [])
        ]
        serialized = json.dumps(stable, sort_keys=True)
        return hashlib.sha256(serialized.encode()).hexdigest()
    except Exception:
        return hashlib.sha256(str(academic_scores).encode()).hexdigest()


# ── Read ─────────────────────────────────────────────────────────────────────

def get_cached_academic_skills(
    student_id: int,
    data_hash: str,
    db: Session,
) -> str | None:
    """
    Returns cached Agent 2 output (raw string) if data_hash matches.
    Returns None on cache miss.
    """
    try:
        row = db.execute(
            select(AcademicSkillCache).where(AcademicSkillCache.student_id == student_id)
        ).scalar_one_or_none()

        if row is None:
            logger.info("[academic_cache] Cache MISS — no row for student_id=%s", student_id)
            return None

        if row.data_hash != data_hash:
            logger.info(
                "[academic_cache] Cache MISS — hash changed for student_id=%s "
                "(stored=%s new=%s)",
                student_id, row.data_hash[:8], data_hash[:8],
            )
            return None

        if not row.academic_skills:
            logger.info("[academic_cache] Cache MISS — empty skills for student_id=%s", student_id)
            return None

        logger.info(
            "[academic_cache] Cache HIT — reusing academic output for student_id=%s (hash=%s)",
            student_id, data_hash[:8],
        )
        return row.academic_skills  # raw JSON string (Agent 2's output)

    except Exception as exc:
        logger.warning(
            "[academic_cache] Read error for student_id=%s: %s — will re-extract",
            student_id, exc,
        )
        return None


# ── Write ─────────────────────────────────────────────────────────────────────

def save_academic_skills(
    student_id: int,
    data_hash: str,
    raw_output: str,
    db: Session,
) -> None:
    """
    Upserts the cache row with Agent 2's raw output string after a fresh run.
    """
    try:
        now = datetime.now(timezone.utc)

        row = db.execute(
            select(AcademicSkillCache).where(AcademicSkillCache.student_id == student_id)
        ).scalar_one_or_none()

        if row is None:
            row = AcademicSkillCache(
                student_id=student_id,
                data_hash=data_hash,
                academic_skills=raw_output,
                created_at=now,
                updated_at=now,
            )
            db.add(row)
        else:
            row.data_hash = data_hash
            row.academic_skills = raw_output
            row.updated_at = now

        db.commit()
        logger.info(
            "[academic_cache] Saved academic output for student_id=%s (hash=%s)",
            student_id, data_hash[:8],
        )
    except Exception as exc:
        logger.warning(
            "[academic_cache] Write error for student_id=%s: %s — cache not saved",
            student_id, exc,
        )
        try:
            db.rollback()
        except Exception:
            pass
