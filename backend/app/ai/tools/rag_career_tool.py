"""
rag_career_tool.py — CrewAI tool that queries the pgvector knowledge base
to retrieve semantically relevant career paths, ILOs, and curriculum context.

Replaces the static CareerTaxonomyTool with live vector search.
"""
import json
from typing import Any

from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text

from app.ai.embeddings import embed_query
from app.core.config import DATABASE_URL

# Sync engine for use inside CrewAI tools (crew.kickoff runs in a thread)
_sync_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
_sync_engine = create_engine(_sync_url, pool_pre_ping=True)


class RAGCareerInput(BaseModel):
    query: str = Field(
        description=(
            "A natural language question or skill description to search the knowledge base. "
            "Examples: 'What career paths match Python and machine learning skills?', "
            "'What are the required skills for an embedded systems engineer?', "
            "'Show me IoT and cloud career requirements'"
        )
    )
    category: str = Field(
        default="all",
        description=(
            "Filter by category: 'all', 'career_path', 'ilo', 'curriculum', "
            "'gap_closer', 'ph_tech_eco', 'prof_skills', or 'resources'"
        ),
    )
    top_k: int = Field(default=5, description="Number of top results to return (1-10)")


class RAGCareerTool(BaseTool):
    name: str = "rag_career_knowledge"
    description: str = (
        "Searches the ASPIRE knowledge base using semantic vector search. "
        "Returns the most relevant career paths, ILO competency descriptions, "
        "and curriculum information based on a natural language query. "
        "Use this to find career paths that match specific skills or to understand "
        "what competencies are needed for a particular career track. "
        "Always use specific, descriptive queries for best results."
    )
    args_schema: type[BaseModel] = RAGCareerInput

    def _run(self, query: str, category: str = "all", top_k: int = 5) -> str:
        """
        Embed the query and run cosine similarity search against knowledge_chunks.
        Returns formatted results as a JSON string.
        """
        try:
            query_vec = embed_query(query)
        except Exception as e:
            return f"Embedding error: {e}"

        # Build the pgvector cosine similarity query
        # <=> operator = cosine distance (lower = more similar)
        if category == "all":
            sql = text("""
                SELECT title, category, content,
                       1 - (embedding <=> CAST(:vec AS vector)) AS similarity
                FROM knowledge_chunks
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT :k
            """)
            params = {"vec": str(query_vec), "k": min(top_k, 10)}
        else:
            sql = text("""
                SELECT title, category, content,
                       1 - (embedding <=> CAST(:vec AS vector)) AS similarity
                FROM knowledge_chunks
                WHERE embedding IS NOT NULL AND category = :cat
                ORDER BY embedding <=> CAST(:vec AS vector)
                LIMIT :k
            """)
            params = {"vec": str(query_vec), "k": min(top_k, 10), "cat": category}

        try:
            with _sync_engine.connect() as conn:
                rows = conn.execute(sql, params).fetchall()
        except Exception as e:
            return f"Database search error: {e}"

        if not rows:
            return json.dumps({
                "query": query,
                "results": [],
                "message": "No relevant knowledge found. The knowledge base may not be seeded yet."
            })

        results = [
            {
                "title": row.title,
                "category": row.category,
                "content": row.content,
                "similarity_score": round(float(row.similarity), 4),
            }
            for row in rows
        ]

        return json.dumps({
            "query": query,
            "results": results,
            "total_retrieved": len(results),
        }, indent=2)
