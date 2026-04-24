"""
chat_routes.py — Career-coach chatbot backed by Gemini with persistent sessions.
"""
from typing import Literal, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from google import genai
from google.genai import types
from google.genai import errors as genai_errors

from app.api.deps import get_current_student
from app.core.config import GEMINI_MODEL, VERTEX_AI_PROJECT, VERTEX_AI_LOCATION
from app.core.database import get_session, async_session_factory
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.pipeline_models import CareerReport

router = APIRouter(prefix="/chat", tags=["Chat"])

# Gemini client
_MODEL_ID = GEMINI_MODEL.split("/", 1)[1] if "/" in GEMINI_MODEL else GEMINI_MODEL
_client = genai.Client(
    vertexai=True,
    project=VERTEX_AI_PROJECT,
    location=VERTEX_AI_LOCATION,
)

class ChatMessageSchema(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class CreateSessionRequest(BaseModel):
    context: dict | None = None

class CreateSessionResponse(BaseModel):
    session_id: int
    label: str

class SendMessageRequest(BaseModel):
    session_id: int
    message: str
    context: dict | None = None

class SendMessageResponse(BaseModel):
    reply: str
    session_id: int

class SessionHistoryResponse(BaseModel):
    session_id: int
    label: str | None
    messages: list[ChatMessageSchema]

class SessionListItem(BaseModel):
    session_id: int
    label: str | None
    created_at: str
    message_count: int

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
            lines.append(f"- {title} ({score}% match)")
    
    tech = profile.get("technical_skills") or []
    langs = profile.get("programming_languages") or []
    if langs:
        lines.append("\nProgramming languages: " + ", ".join(f"{s.get('name')} ({s.get('proficiency')})" for s in langs[:8]))
    if tech:
        lines.append("Technical skills: " + ", ".join(f"{s.get('name')} ({s.get('proficiency')})" for s in tech[:8]))
    
    return "\n".join(lines)

async def _latest_report_id(student_id: int, db: AsyncSession) -> int | None:
    result = await db.execute(
        select(CareerReport)
        .where(CareerReport.student_id == student_id)
        .order_by(CareerReport.created_at.desc())
        .limit(1)
    )
    report = result.scalar_one_or_none()
    return report.id if report else None

@router.post("/session", response_model=CreateSessionResponse)
async def create_session(
    body: CreateSessionRequest,
    current_user: User = Depends(get_current_student),
):
    async with async_session_factory() as db:
        report_id = await _latest_report_id(current_user.id, db)
        top_career = None
        if body.context:
            matches = body.context.get("career_matches") or []
            if matches:
                top_career = matches[0].get("title")
        now = datetime.utcnow()
        label = now.strftime("%b %d") + (f" · {top_career}" if top_career else "")
        
        session = ChatSession(
            student_id=current_user.id,
            career_report_id=report_id,
            label=label
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return {"session_id": session.id, "label": session.label}

@router.get("/sessions", response_model=list[SessionListItem])
async def list_sessions(
    current_user: User = Depends(get_current_student),
):
    async with async_session_factory() as db:
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.student_id == current_user.id)
            .order_by(ChatSession.updated_at.desc())
        )
        sessions = result.scalars().all()
        return [
            {
                "session_id": s.id,
                "label": s.label,
                "created_at": s.created_at.isoformat(),
                "message_count": 0  # Simplified for now
            }
            for s in sessions
        ]

@router.get("/session/{session_id}", response_model=SessionHistoryResponse)
async def get_session_history(
    session_id: int,
    current_user: User = Depends(get_current_student),
):
    async with async_session_factory() as db:
        session = await db.get(ChatSession, session_id)
        if not session or session.student_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found.")
        
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        messages = result.scalars().all()
        return {
            "session_id": session.id,
            "label": session.label,
            "messages": [{"role": m.role, "content": m.content} for m in messages]
        }

@router.post("/career", response_model=SendMessageResponse)
async def send_career_message(
    body: SendMessageRequest,
    current_user: User = Depends(get_current_student),
):
    async with async_session_factory() as db:
        session = await db.get(ChatSession, body.session_id)
        if not session or session.student_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found.")

        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == body.session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        history = result.scalars().all()

        user_msg = ChatMessage(
            session_id=body.session_id,
            role="user",
            content=body.message
        )
        db.add(user_msg)
        await db.commit()

        contents = [
            {"role": "user" if m.role == "user" else "model", "parts": [{"text": m.content}]}
            for m in history
        ]
        contents.append({"role": "user", "parts": [{"text": body.message}]})

        system_prompt = _build_system_prompt(current_user.full_name or "Student", body.context)

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
        assistant_msg = ChatMessage(
            session_id=body.session_id,
            role="assistant",
            content=reply
        )
        db.add(assistant_msg)
        session.updated_at = datetime.utcnow()
        db.add(session)
        await db.commit()

        return {"reply": reply, "session_id": body.session_id}
