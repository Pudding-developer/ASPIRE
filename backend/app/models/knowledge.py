"""
knowledge.py — SQLModel for storing RAG knowledge chunks with pgvector embeddings.
"""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, JSON

EMBEDDING_DIM = 768  # gemini-embedding-001 output dimension (reduced)


class KnowledgeChunk(SQLModel, table=True):
    __tablename__ = "knowledge_chunks"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Categorize the document type for filtering
    category: str = Field(index=True)  # "career_path" | "ilo" | "curriculum"

    # Human-readable title of the chunk
    title: str

    # Full text content of the chunk
    content: str = Field(sa_column=Column(Text, nullable=False))

    # The vector embedding (768-dim from gemini-embedding-001)
    embedding: list = Field(
        default=None,
        sa_column=Column(JSON, nullable=True)
    )


class EmbeddingCache(SQLModel, table=True):
    """Caches Gemini embedding results so repeat queries skip the API.

    Key is sha256(task_type + ':' + text) — deterministic and avoids storing
    the raw query text. Survives across restarts; safe to wipe at any time
    (the next call simply re-populates).
    """
    __tablename__ = "embedding_cache"

    query_hash: str = Field(primary_key=True, max_length=64)
    vector: list = Field(sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)

