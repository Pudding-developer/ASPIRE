"""
admin_service.py — Admin business logic for dashboard, token management,
and instructor management.
"""
import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import admin_repository, token_repository, instructor_repository, user_repository
from app.services.email_service import send_instructor_invite

from app.core.config import FRONTEND_URL

FRONTEND_BASE_URL = FRONTEND_URL


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

async def get_dashboard_stats(db: AsyncSession) -> dict:
    return await admin_repository.get_stats(db)


# ---------------------------------------------------------------------------
# Token management
# ---------------------------------------------------------------------------

def _token_status(token) -> str:
    if token.is_used:
        return "used"
    if token.expires_at < datetime.now():
        return "expired"
    return "pending"


async def generate_invite_token(
    db: AsyncSession,
    assigned_email: str | None = None,
    expires_in_hours: int = 48,
) -> dict:
    token_value = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(hours=expires_in_hours)

    invite = await token_repository.create(
        db,
        token=token_value,
        assigned_email=assigned_email,
        expires_at=expires_at,
    )

    invite_link = f"{FRONTEND_BASE_URL}/instructor/register?token={token_value}"

    email_sent = False
    if assigned_email:
        expires_str = expires_at.strftime("%B %d, %Y at %I:%M %p")
        email_sent = await send_instructor_invite(assigned_email, invite_link, token_value, expires_str)

    if assigned_email:
        message = f"Invite sent to {assigned_email}" if email_sent else "Token created but email failed. Copy the link manually."
    else:
        message = "Copy this link now. The token will not be shown again."

    return {
        "data": {
            "token": token_value,
            "invite_link": invite_link,
            "assigned_email": invite.assigned_email,
            "expires_at": invite.expires_at.isoformat(),
            "email_sent": email_sent,
        },
        "message": message,
    }


async def list_tokens(db: AsyncSession) -> list[dict]:
    tokens = await token_repository.get_all(db)
    return [
        {
            "id": t.id,
            "token": t.token,
            "assigned_email": t.assigned_email,
            "status": _token_status(t),
            "used_by_email": t.used_by_email,
            "used_at": t.used_at.isoformat() if t.used_at else None,
            "expires_at": t.expires_at.isoformat(),
            "created_at": t.created_at.isoformat() + "Z",
        }
        for t in tokens
    ]


async def delete_token(db: AsyncSession, token_id: int) -> None:
    invite = await token_repository.get_by_id(db, token_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Token not found.")
    if invite.is_used:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a used token.",
            headers={"X-Error-Code": "TOKEN_ALREADY_USED"},
        )
    await token_repository.delete(db, token_id)


# ---------------------------------------------------------------------------
# Instructor management
# ---------------------------------------------------------------------------

async def list_instructors(db: AsyncSession) -> list[dict]:
    instructors = await instructor_repository.get_all(db)
    return [
        {
            "id": i.id,
            "email": i.email,
            "full_name": i.full_name,
            "avatar_url": i.avatar_url,
            "is_active": i.is_active,
            "created_at": i.created_at.isoformat() + "Z",
        }
        for i in instructors
    ]


async def deactivate_instructor(db: AsyncSession, instructor_id: int) -> None:
    instructor = await instructor_repository.get_by_id(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")
    await instructor_repository.deactivate(db, instructor_id)


async def activate_instructor(db: AsyncSession, instructor_id: int) -> None:
    instructor = await instructor_repository.get_by_id(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")
    await instructor_repository.activate(db, instructor_id)


async def remove_instructor(db: AsyncSession, instructor_id: int) -> None:
    instructor = await instructor_repository.get_by_id(db, instructor_id)
    if not instructor:
        raise HTTPException(status_code=404, detail="Instructor not found.")

    if instructor.is_active:
        active_count = await instructor_repository.count_active(db)
        if active_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the only active instructor.",
                headers={"X-Error-Code": "LAST_INSTRUCTOR"},
            )

    await instructor_repository.delete(db, instructor_id)


# ---------------------------------------------------------------------------
# Student management
# ---------------------------------------------------------------------------

async def list_students(
    db: AsyncSession,
    page: int = 1,
    limit: int = 10,
    search: str | None = None
) -> dict:
    from sqlmodel import select
    from app.models.instructor import Instructor

    students, total_count = await user_repository.get_students_paginated(
        db, page=page, limit=limit, search=search
    )
    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
    
    # Fetch active instructors to map ID -> Name
    result_ins = await db.execute(select(Instructor))
    instructors_map = {ins.id: ins.full_name for ins in result_ins.scalars().all()}

    return {
        "students": [
            {
                "id": s.id,
                "email": s.email,
                "sr_code": s.sr_code,
                "full_name": s.full_name,
                "avatar_url": s.avatar_url,
                "chosen_career": s.chosen_career,
                "career_chosen_at": s.career_chosen_at.isoformat() + "Z" if s.career_chosen_at else None,
                "advisor_id": s.advisor_id,
                "advisor_name": instructors_map.get(s.advisor_id) if s.advisor_id else None,
            }
            for s in students
        ],
        "page": page,
        "total_pages": total_pages,
        "total_count": total_count,
    }


async def assign_advisor(db: AsyncSession, student_id: int, advisor_id: int | None) -> None:
    from app.models.user import User
    from app.models.instructor import Instructor
    from sqlmodel import select

    # Verify student exists
    result_stu = await db.execute(select(User).where(User.id == student_id, User.role == "student"))
    student = result_stu.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Verify advisor exists if advisor_id is not None
    if advisor_id is not None:
        result_adv = await db.execute(select(Instructor).where(Instructor.id == advisor_id))
        advisor = result_adv.scalar_one_or_none()
        if not advisor:
            raise HTTPException(status_code=404, detail="Instructor not found.")

    student.advisor_id = advisor_id
    db.add(student)
    await db.commit()


# ---------------------------------------------------------------------------
# Curriculum Management
# ---------------------------------------------------------------------------

async def get_curricula(db: AsyncSession) -> list[dict]:
    from app.models.curriculum import Curriculum
    from sqlmodel import select
    result = await db.execute(select(Curriculum).order_by(Curriculum.uploaded_at.desc()))
    curricula = result.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "uploaded_at": c.uploaded_at.isoformat()
        }
        for c in curricula
    ]


async def get_curriculum_subjects(db: AsyncSession, curriculum_id: int) -> list[dict]:
    from app.models.curriculum import CurriculumSubject
    from sqlmodel import select
    result = await db.execute(
        select(CurriculumSubject)
        .where(CurriculumSubject.curriculum_id == curriculum_id)
        .order_by(
            CurriculumSubject.year,
            CurriculumSubject.semester,
            CurriculumSubject.code
        )
    )
    subjects = result.scalars().all()
    return [
        {
            "id": s.id,
            "curriculum_id": s.curriculum_id,
            "year": s.year,
            "semester": s.semester,
            "code": s.code,
            "title": s.title
        }
        for s in subjects
    ]


async def upload_curriculum(db: AsyncSession, file_bytes: bytes, filename: str, custom_name: str = None) -> dict:
    import json
    import csv
    import io
    import pypdf
    from google import genai
    from google.genai import types
    from app.core.config import GEMINI_MODEL, GEMINI_API_KEY, USE_GEMINI_API_KEY, VERTEX_AI_PROJECT, VERTEX_AI_LOCATION
    from app.models.curriculum import Curriculum, CurriculumSubject
    from ml.config import COURSE_PROFILES

    # 1. Parse subjects based on file type
    fn_lower = filename.lower()
    subjects_data = []

    if fn_lower.endswith(".pdf"):
        # PDF parsing via pypdf and Gemini
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pdf_text = ""
        for page in reader.pages:
            txt = page.extract_text()
            if txt:
                pdf_text += txt + "\n"
        
        if not pdf_text.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract text from the uploaded PDF.")
        
        _MODEL_ID = GEMINI_MODEL.split("/", 1)[1] if "/" in GEMINI_MODEL else GEMINI_MODEL
        _client = (
            genai.Client(api_key=GEMINI_API_KEY)
            if USE_GEMINI_API_KEY
            else genai.Client(
                vertexai=True,
                project=VERTEX_AI_PROJECT,
                location=VERTEX_AI_LOCATION,
            )
        )
        
        prompt = (
            "Extract all courses/subjects from the following university curriculum PDF text. "
            "Structure the output as a JSON array of objects. Each object MUST have these keys: "
            "'year' (string representing year level, e.g., '1', '2', '3', '4'), "
            "'semester' (string representing semester, e.g., '1', '2' or '3' for midyear/summer), "
            "'code' (string representing course code, e.g., 'CpE 401', 'ENGG 401'), "
            "'title' (string representing course title, e.g., 'Computer Programming 1').\n\n"
            "Ensure every single subject with units/hours in the text is extracted. "
            "Here is the text:\n"
            f"{pdf_text}"
        )
        
        try:
            response = _client.models.generate_content(
                model=_MODEL_ID,
                contents=[{"role": "user", "parts": [{"text": prompt}]}],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=types.Schema(
                        type=types.Type.ARRAY,
                        items=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "year": types.Schema(type=types.Type.STRING),
                                "semester": types.Schema(type=types.Type.STRING),
                                "code": types.Schema(type=types.Type.STRING),
                                "title": types.Schema(type=types.Type.STRING),
                            },
                            required=["year", "semester", "code", "title"],
                        )
                    )
                )
            )
            subjects_data = json.loads(response.text)
            if not isinstance(subjects_data, list):
                raise ValueError("Gemini response is not a list")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse PDF via Gemini: {str(e)}"
            )

    elif fn_lower.endswith(".csv"):
        try:
            csv_text = file_bytes.decode("utf-8")
            reader = csv.DictReader(io.StringIO(csv_text))
            required = {"year", "semester", "code", "title"}
            if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
                raise ValueError(f"CSV must contain headers: {', '.join(required)}")
            
            for row in reader:
                subjects_data.append({
                    "year": str(row["year"]).strip(),
                    "semester": str(row["semester"]).strip(),
                    "code": str(row["code"]).strip(),
                    "title": str(row["title"]).strip()
                })
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to parse CSV: {str(e)}")

    elif fn_lower.endswith(".json"):
        try:
            data = json.loads(file_bytes.decode("utf-8"))
            if not isinstance(data, list):
                raise ValueError("JSON must be a list of objects")
            for idx, row in enumerate(data):
                for k in ["year", "semester", "code", "title"]:
                    if k not in row:
                        raise ValueError(f"Item at index {idx} is missing required key '{k}'")
                subjects_data.append({
                    "year": str(row["year"]).strip(),
                    "semester": str(row["semester"]).strip(),
                    "code": str(row["code"]).strip(),
                    "title": str(row["title"]).strip()
                })
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to parse JSON: {str(e)}")
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF, CSV, or JSON file."
        )

    if not subjects_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No subjects found in the uploaded file.")

    # 2. Validate course titles against COURSE_PROFILES
    warnings = []
    known_keys_lower = {k.lower().strip() for k in COURSE_PROFILES.keys()}
    for s in subjects_data:
        title_clean = s["title"].lower().strip()
        if title_clean not in known_keys_lower:
            warnings.append(s["title"])

    # 3. Create a new Curriculum version metadata and populate its subjects
    curriculum_name = custom_name.strip() if (custom_name and custom_name.strip()) else filename
    new_curriculum = Curriculum(name=curriculum_name)
    db.add(new_curriculum)
    await db.flush()  # populate new_curriculum.id in the session
    
    for s in subjects_data:
        db.add(CurriculumSubject(
            curriculum_id=new_curriculum.id,
            year=s["year"],
            semester=s["semester"],
            code=s["code"],
            title=s["title"]
        ))
    
    await db.commit()

    return {
        "curriculum_id": new_curriculum.id,
        "curriculum_name": new_curriculum.name,
        "count": len(subjects_data),
        "warnings": list(set(warnings))  # Unique list of warnings
    }



