"""
chat_routes.py — Career-coach chatbot backed by Gemini.

Stateless endpoint: the frontend holds the full message history and replays it
on each turn. The student's latest career report is passed as `context` so the
model grounds its answers in the student's real matches, skills, and gaps.
"""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from app.api.deps import get_current_student
from app.core.config import GEMINI_MODEL, VERTEX_AI_PROJECT, VERTEX_AI_LOCATION
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Chat"])


# Strip "vertex_ai/" litellm prefix to get the bare model id for google-genai.
_MODEL_ID = GEMINI_MODEL.split("/", 1)[1] if "/" in GEMINI_MODEL else GEMINI_MODEL
# Auth via GOOGLE_APPLICATION_CREDENTIALS (service account JSON) — no explicit key needed.
_client = genai.Client(
    vertexai=True,
    project=VERTEX_AI_PROJECT,
    location=VERTEX_AI_LOCATION,
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=40)
    context: dict | None = None


class ChatResponse(BaseModel):
    reply: str


def _build_system_prompt(student_name: str, context: dict | None) -> str:
    base = (
        f"You are ASPIRE's AI career coach, speaking with {student_name}, a BSU "
        "Computer Engineering student. Be concise (2-4 short paragraphs max), "
        "encouraging, and specific. Ground every answer in the student's data "
        "below — cite exact skill names, percentages, and career titles. Never "
        "invent skills or matches that aren't present. If the question is "
        "unrelated to career guidance, skills, or the student's roadmap, "
        "politely redirect."
    )
    if not context:
        return base + "\n\n(No career report is available yet — suggest running the pipeline.)"

    matches = context.get("career_matches") or []
    profile = context.get("skill_profile") or {}
    gaps = context.get("gap_analysis") or []
    summary = context.get("summary") or ""
    chosen = context.get("chosen_career")

    lines = [base, "", "=== STUDENT DATA ==="]
    if summary:
        lines.append(f"Summary: {summary}")
    if chosen:
        lines.append(f"Chosen career goal: {chosen}")
    if matches:
        lines.append("\nCareer matches:")
        for m in matches[:5]:
            title = m.get("title", "?")
            score = m.get("match_score", "?")
            matched = ", ".join(m.get("matched_skills", [])[:6]) or "—"
            missing = ", ".join(m.get("gap_skills", [])[:6]) or "—"
            lines.append(f"- {title} ({score}% match) | strengths: {matched} | gaps: {missing}")
    tech = profile.get("technical_skills") or []
    langs = profile.get("programming_languages") or []
    if langs:
        lines.append("\nProgramming languages: " + ", ".join(
            f"{s.get('name')} ({s.get('proficiency')})" for s in langs[:10]
        ))
    if tech:
        lines.append("Technical skills: " + ", ".join(
            f"{s.get('name')} ({s.get('proficiency')})" for s in tech[:10]
        ))
    if gaps:
        lines.append("\nTop gaps to close: " + ", ".join(
            g.get("skill", "?") for g in gaps[:8]
        ))
    return "\n".join(lines)


@router.post("/career", response_model=ChatResponse)
async def career_chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_student),
):
    # Vertex AI ADC — always available once gcloud auth application-default login is done.

    system_prompt = _build_system_prompt(current_user.full_name or "Student", body.context)

    # google-genai's generate_content takes a plain "contents" list; we map
    # assistant -> "model" (the role name the SDK expects).
    contents = [
        {
            "role": "user" if m.role == "user" else "model",
            "parts": [{"text": m.content}],
        }
        for m in body.messages
    ]

    try:
        response = _client.models.generate_content(
            model=_MODEL_ID,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=600,
            ),
        )
    except genai_errors.APIError as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {e}") from e

    reply = (response.text or "").strip()
    if not reply:
        raise HTTPException(status_code=502, detail="AI returned an empty response.")
    return ChatResponse(reply=reply)
