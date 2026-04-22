"""
embeddings.py — Thin wrapper around Google Gemini Embeddings.

Uses the existing GEMINI_API_KEY from config.
Dimension: 768 (matches pgvector column in KnowledgeChunk).

NOTE: Uses `google-genai` (the new unified SDK) instead of the legacy
`google-generativeai` package.
"""
from google import genai
from google.genai import types

from app.core.config import VERTEX_AI_PROJECT, VERTEX_AI_LOCATION

_client = genai.Client(
    vertexai=True,
    project=VERTEX_AI_PROJECT,
    location=VERTEX_AI_LOCATION,
)

EMBEDDING_MODEL = "gemini-embedding-001"


def embed_text(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    """
    Embed a single string using Gemini embedding model.
    Dimensionality is forced to 768 to match our database column.

    Args:
        text: The text to embed.
        task_type: 'RETRIEVAL_DOCUMENT' when storing, 'RETRIEVAL_QUERY' when querying.

    Returns:
        A list of 768 floats.
    """
    response = _client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=768
        ),
    )
    return response.embeddings[0].values


def embed_query(query: str) -> list[float]:
    """Convenience wrapper for query-time embedding."""
    return embed_text(query, task_type="RETRIEVAL_QUERY")

