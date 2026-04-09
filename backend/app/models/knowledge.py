"""
knowledge.py — SQLModel for storing RAG knowledge chunks with pgvector embeddings.
"""
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text
from pgvector.sqlalchemy import Vector

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
        sa_column=Column(Vector(EMBEDDING_DIM), nullable=True)
    )
