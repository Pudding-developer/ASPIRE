"""
career_catalog.py — Single source of truth for career path data.

All career metadata (titles, required skills, roadmap URLs, blurbs, slugs)
is derived from the `knowledge_chunks` table (category = 'career_path').

Adding a new career: update the knowledge base (reseed or INSERT a new chunk)
— nothing else needs to change.
"""

from __future__ import annotations

import re
from functools import lru_cache
from typing import TypedDict

from sqlalchemy import text
from sqlalchemy.orm import Session


class CareerInfo(TypedDict):
    title: str
    blurb: str
    skills: list[str]       # top required skills (display labels)
    roadmap: str             # roadmap.sh URL
    slug: str                # derived from roadmap URL (e.g. "machine-learning")
    required_skills: list[str]  # full required-skill keyword list for scoring


def _parse_career_chunk(title: str, content: str) -> CareerInfo:
    """Parse a career_path knowledge chunk into a structured CareerInfo dict."""
    lines = [l.strip() for l in content.replace("\r", "").split("\n") if l.strip()]
    content_flat = content.replace("\n", " ").replace("\r", "")

    # ── Required skills ────────────────────────────────────────────────────
    required_skills: list[str] = []
    req_match = re.search(r"Required skills:\s*(.+?)(?:BSCpE|ABET|Roadmap|Learning order|$)", content_flat, re.IGNORECASE | re.DOTALL)
    if req_match:
        raw = req_match.group(1).strip().rstrip(".")
        # Split on commas and "or" separators, normalise
        parts = re.split(r",|\bor\b", raw)
        required_skills = [p.strip().lower() for p in parts if p.strip()]

    # ── Roadmap URL ────────────────────────────────────────────────────────
    roadmap_url = ""
    for line in lines:
        if line.lower().startswith("roadmap:"):
            roadmap_url = line.split(":", 1)[1].strip()
            break

    # ── Slug from roadmap URL (last path segment) ──────────────────────────
    slug = roadmap_url.rstrip("/").split("/")[-1] if roadmap_url else title.lower().replace(" ", "-")

    # ── Blurb from "Also known as" or "market outlook" line ────────────────
    blurb = ""
    outlook_match = re.search(r"Philippine market outlook:\s*(.+?)(?:\n|$)", content, re.IGNORECASE)
    if outlook_match:
        blurb = outlook_match.group(1).strip().rstrip(".")
    if not blurb:
        blurb = f"A growing career path for BSCpE graduates in the Philippine tech industry."

    # ── Display skills (top 4 required skills, title-cased) ───────────────
    display_skills = [s.title() for s in required_skills[:4]]

    return CareerInfo(
        title=title,
        blurb=blurb,
        skills=display_skills,
        roadmap=roadmap_url,
        slug=slug,
        required_skills=required_skills,
    )


def load_careers_sync(sync_db: Session) -> list[CareerInfo]:
    """
    Load all career_path chunks from the knowledge base synchronously.
    Returns a list of CareerInfo dicts ordered alphabetically by title.
    """
    rows = sync_db.execute(
        text("SELECT title, content FROM knowledge_chunks WHERE category = 'career_path' ORDER BY title")
    ).fetchall()
    return [_parse_career_chunk(title, content) for title, content in rows]


async def load_careers(db) -> list[CareerInfo]:
    """
    Load all career_path chunks from the knowledge base asynchronously.
    `db` is an AsyncSession.
    """
    from sqlalchemy import text as atext
    result = await db.execute(
        atext("SELECT title, content FROM knowledge_chunks WHERE category = 'career_path' ORDER BY title")
    )
    rows = result.fetchall()
    return [_parse_career_chunk(title, content) for title, content in rows]


# ---------------------------------------------------------------------------
# Cached helpers used by pipeline_service and student_routes
# These are loaded ONCE at startup via the first request that needs them,
# then re-used from an in-process cache for the lifetime of the server.
# ---------------------------------------------------------------------------

_catalog_cache: list[CareerInfo] | None = None


def get_catalog_sync(sync_db: Session) -> list[CareerInfo]:
    """Return the career catalog, using module-level cache after first load."""
    global _catalog_cache
    if _catalog_cache is None:
        _catalog_cache = load_careers_sync(sync_db)
    return _catalog_cache


def get_sync_catalog() -> list[CareerInfo]:
    """
    Zero-argument version of get_catalog_sync — auto-creates its own sync
    DB engine.  Use this from synchronous code that doesn't hold a Session
    (e.g. the pipeline fallback scorer).
    Cached after the first call so the DB is only hit once per process.
    """
    global _catalog_cache
    if _catalog_cache is not None:
        return _catalog_cache

    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session as SyncSession
    from app.core.config import DATABASE_URL  # type: ignore

    sync_url = DATABASE_URL.replace("+asyncpg", "").replace("+psycopg2", "")
    engine = create_engine(sync_url, pool_pre_ping=True)
    with SyncSession(engine) as session:
        _catalog_cache = load_careers_sync(session)
    return _catalog_cache


def invalidate_cache() -> None:
    """Call this after reseeding the knowledge base."""
    global _catalog_cache
    _catalog_cache = None


def get_valid_titles(sync_db: Session) -> set[str]:
    return {c["title"] for c in get_catalog_sync(sync_db)}


def get_roadmap_links(sync_db: Session) -> dict[str, str]:
    return {c["title"]: c["roadmap"] for c in get_catalog_sync(sync_db)}


def get_required_skills_map(sync_db: Session) -> dict[str, set[str]]:
    return {c["title"]: set(c["required_skills"]) for c in get_catalog_sync(sync_db)}

