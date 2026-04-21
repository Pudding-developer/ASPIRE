"""
llm_factory.py — single source of truth for the CrewAI LLM used by all agents.

Provider is selected via the LLM_PROVIDER env var ("gemini" or "ollama").
"""
from crewai import LLM

from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    LLM_PROVIDER,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
)


def get_llm() -> LLM:
    if LLM_PROVIDER == "ollama":
        return LLM(
            model=OLLAMA_MODEL,
            base_url=OLLAMA_BASE_URL,
            max_retries=5,
            timeout=1800,
        )

    return LLM(
        model=GEMINI_MODEL,
        api_key=GEMINI_API_KEY,
        max_retries=5,
        timeout=120,
    )
