"""
embeddings.py — Thin wrapper around Google Gemini Embeddings.

Uses the existing GEMINI_API_KEY from config.
Dimension: 768 (matches pgvector column in KnowledgeChunk).

NOTE: Uses `google-genai` (the new unified SDK) instead of the legacy
`google-generativeai` package.
"""
import hashlib

from google import genai
from google.genai import types
from sqlalchemy import create_engine, text

from app.core.config import (
    DATABASE_URL,
    VERTEX_AI_PROJECT, VERTEX_AI_LOCATION,
    GEMINI_API_KEY, USE_GEMINI_API_KEY,
)

_client = (
    genai.Client(api_key=GEMINI_API_KEY)
    if USE_GEMINI_API_KEY
    else genai.Client(
        vertexai=True,
        project=VERTEX_AI_PROJECT,
        location=VERTEX_AI_LOCATION,
    )
)

EMBEDDING_MODEL = "gemini-embedding-001"

# Sync engine — CrewAI tools call embed_text() from worker threads.
_sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
_cache_engine = create_engine(_sync_url, pool_pre_ping=True)


def _cache_key(task_type: str, body: str) -> str:
    return hashlib.sha256(f"{task_type}:{body}".encode("utf-8")).hexdigest()


def _cache_get(key: str) -> list[float] | None:
    try:
        with _cache_engine.connect() as conn:
            row = conn.execute(
                text("SELECT vector FROM embedding_cache WHERE query_hash = :k"),
                {"k": key},
            ).first()
        if row is None:
            return None
        # pgvector returns the vector as a string like "[0.1,0.2,...]"
        v = row[0]
        if isinstance(v, str):
            return [float(x) for x in v.strip("[]").split(",")]
        return list(v)
    except Exception:
        return None


def _cache_put(key: str, vec: list[float]) -> None:
    try:
        with _cache_engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO embedding_cache (query_hash, vector) "
                    "VALUES (:k, CAST(:v AS vector)) "
                    "ON CONFLICT (query_hash) DO NOTHING"
                ),
                {"k": key, "v": str(vec)},
            )
    except Exception:
        # Cache failure must never break the call path.
        pass


def embed_text(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    """
    Embed a single string using Gemini embedding model.
    Dimensionality is forced to 768 to match our database column.

    Results are cached in `embedding_cache` keyed by sha256(task_type:text),
    so repeat queries skip the API entirely. The cache is best-effort —
    any DB error falls through to a live API call.
    """
    key = _cache_key(task_type, text)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    response = _client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=768
        ),
    )
    vec = list(response.embeddings[0].values)
    _cache_put(key, vec)
    return vec


def embed_query(query: str) -> list[float]:
    """Convenience wrapper for query-time embedding."""
    return embed_text(query, task_type="RETRIEVAL_QUERY")

