"""
embeddings.py — Thin wrapper around Google Gemini text-embedding-004.

Uses the existing GEMINI_API_KEY from config.
Dimension: 768 (matches pgvector column in KnowledgeChunk).
"""
import google.generativeai as genai

from app.core.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

EMBEDDING_MODEL = "models/text-embedding-004"


def embed_text(text: str, task_type: str = "retrieval_document") -> list[float]:
    """
    Embed a single string using Gemini text-embedding-004.

    Args:
        text: The text to embed.
        task_type: 'retrieval_document' when storing, 'retrieval_query' when querying.

    Returns:
        A list of 768 floats.
    """
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type=task_type,
    )
    return result["embedding"]


def embed_query(query: str) -> list[float]:
    """Convenience wrapper for query-time embedding."""
    return embed_text(query, task_type="retrieval_query")
