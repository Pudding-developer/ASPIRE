"""
auth_service.py — Authentication business logic.

Uses repositories for all DB access. No direct queries.
"""
import asyncio
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import ALLOWED_EMAIL_DOMAIN
from app.core.security import get_password_hash, verify_password
from app.repositories import user_repository, instructor_repository, admin_repository, token_repository
from app.schemas.user import LocalRegisterRequest, LocalLoginRequest
from app.services.token_service import build_jwt, create_temp_token
from app.services.email_service import send_student_welcome, send_instructor_welcome


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class InstructorRegisterError(Exception):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)



# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def extract_sr_code(email: str) -> str:
    return email.split("@")[0]


def validate_email_domain(email: str) -> None:
    domain = ALLOWED_EMAIL_DOMAIN or "g.batstate-u.edu.ph"
    if not email.lower().endswith(f"@{domain}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only @{domain} email addresses are allowed.",
        )



# ---------------------------------------------------------------------------
# Google OAuth — unified role-detection login flow
# ---------------------------------------------------------------------------

async def google_login_flow(
    session: AsyncSession,
    google_user: dict,
    flow: str,
) -> tuple[str, str]:
    """
    Detects user role by checking tables: Admin, Instructor, User.
    Returns (jwt_token, redirect_path).
    """
    email = google_user["email"].lower()
    google_id = str(google_user["id"])
    full_name = (
        f"{google_user.get('given_name', '')} {google_user.get('family_name', '')}".strip()
        or google_user.get("name", "")
    )
    avatar_url = google_user.get("picture", "")

    found_roles = []

    # Admin (takes precedence for instant login)
    admin = await admin_repository.get_by_email(session, email)
    if admin:
        admin.google_id = google_id
        admin.avatar_url = avatar_url
        admin.full_name = full_name
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        token = build_jwt(admin, "admin")
        return token, "/admin/dashboard"

    # Instructor
    instructor = await instructor_repository.get_by_email(session, email)
    if instructor:
        if not instructor.is_active:
            raise HTTPException(
                status_code=403,
                detail="Your instructor account has been deactivated.",
                headers={"X-Error-Code": "INSTRUCTOR_DEACTIVATED"},
            )
        instructor.google_id = google_id
        instructor.avatar_url = avatar_url
        instructor.full_name = full_name
        session.add(instructor)
        found_roles.append({"role": "instructor", "redirect": "/instructor/dashboard", "entity": instructor, "table_source": "instructor"})

    # Student
    user = await user_repository.get_by_email(session, email)
    if user:
        user.google_id = google_id
        user.avatar_url = avatar_url
        session.add(user)
        found_roles.append({"role": "student", "redirect": "/student/dashboard", "entity": user, "table_source": "user"})

    if found_roles:
        await session.commit()
        for r in found_roles:
            await session.refresh(r["entity"])

    # Not found in any table
    if not found_roles and flow == "login":
        raise HTTPException(
            status_code=404,
            detail="No account found. Please use Get Started to register.",
            headers={"X-Error-Code": "ACCOUNT_NOT_FOUND"},
        )

    # Register new student
    if not found_roles and flow == "register":
        # Removed validate_email_domain(email) to allow any email for students
        sr_code = extract_sr_code(email)
        new_user = await user_repository.create(
            session,
            email=email,
            sr_code=sr_code,
            full_name=full_name,
            google_id=google_id,
            avatar_url=avatar_url,
            role="student",
            auth_provider="google",
            hashed_password=None,
        )
        asyncio.create_task(send_student_welcome(email, full_name))
        found_roles.append({"role": "student", "redirect": "/student/dashboard", "entity": new_user, "table_source": "user"})

    if len(found_roles) == 1:
        role_data = found_roles[0]
        token = build_jwt(role_data["entity"], role_data["table_source"])
        return token, role_data["redirect"]

    # Multiple roles — issue selection token
    roles_info = [{"role": r["role"], "redirect": r["redirect"]} for r in found_roles]
    selection_token = create_temp_token(
        payload={
            "sub": email,
            "type": "role_selection",
            "full_name": full_name,
            "avatar_url": avatar_url,
            "roles": roles_info,
        },
        minutes=15,
    )
    return selection_token, "/auth/select-role"


async def check_register_conflict(session: AsyncSession, email: str) -> bool:
    """Returns True if email exists in any table."""
    if await admin_repository.get_by_email(session, email):
        return True
    if await instructor_repository.get_by_email(session, email):
        return True
    if await user_repository.get_by_email(session, email):
        return True
    return False


# ---------------------------------------------------------------------------
# Local Auth (Email/Password)
# ---------------------------------------------------------------------------

async def local_register_student(session: AsyncSession, data: LocalRegisterRequest) -> str:
    """Registers a student locally and returns a JWT token."""
    email = data.email.lower()
    
    if await check_register_conflict(session, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Account with this email already registered."
        )
        
    if await user_repository.get_by_sr_code(session, data.sr_code):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account with this SR Code already registered."
        )
        
    full_name = f"{data.first_name} {data.last_name}".strip()
    hashed_pw = get_password_hash(data.password)
    
    new_user = await user_repository.create(
        session,
        email=email,
        sr_code=data.sr_code,
        full_name=full_name,
        role="student",
        auth_provider="local",
        hashed_password=hashed_pw,
    )
    
    asyncio.create_task(send_student_welcome(email, full_name))
    
    return build_jwt(new_user, "user")


async def local_login_flow(session: AsyncSession, data: LocalLoginRequest) -> tuple[str, str]:
    """Authenticates a local user and returns (jwt_token, redirect_path)."""
    email = data.email.lower()
    
    # Only checking User (students) for local auth right now
    # If instructors/admins ever get local auth, this will need expansion
    user = await user_repository.get_by_email(session, email)
    
    if not user or user.auth_provider != "local" or not user.hashed_password:
        # Prevent logging into Google-only accounts with password
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or account uses a different login method."
        )
        
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )
        
    token = build_jwt(user, "user")
    return token, "/student/dashboard"


# ---------------------------------------------------------------------------
# Instructor registration via Google OAuth
# ---------------------------------------------------------------------------

async def register_instructor_google(
    session: AsyncSession,
    token_str: str | None,
    google_user: dict,
) -> str:
    if not token_str:
        raise InstructorRegisterError("INVALID_TOKEN")

    invite = await token_repository.get_by_token(session, token_str)
    if not invite or invite.is_used or invite.expires_at < datetime.now():
        raise InstructorRegisterError("INVALID_TOKEN")

    email = google_user["email"].lower()
    domain = ALLOWED_EMAIL_DOMAIN or "g.batstate-u.edu.ph"
    if not email.endswith(f"@{domain}"):
        raise InstructorRegisterError("EMAIL_NOT_ALLOWED")

    if invite.assigned_email and invite.assigned_email.lower() != email:
        raise InstructorRegisterError("EMAIL_MISMATCH")

    if await instructor_repository.get_by_email(session, email):
        raise InstructorRegisterError("ALREADY_REGISTERED")

    given_name = google_user.get("given_name", "")
    family_name = google_user.get("family_name", "")
    full_name = f"{given_name} {family_name}".strip() or google_user.get("name", "")
    google_id = str(google_user.get("id", ""))
    avatar_url = google_user.get("picture", "")

    now = datetime.now()
    instructor = await instructor_repository.create(
        session,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url or None,
        google_id=google_id or None,
        auth_provider="google",
        role="instructor",
        is_active=True,
        created_at=now,
    )

    # Mark token consumed — we need to do this in same transaction
    # Since instructor_repository.create already committed, consume token now
    await token_repository.consume(session, token_str, email)

    asyncio.create_task(send_instructor_welcome(email, full_name))

    return build_jwt(instructor, "instructor")


# ---------------------------------------------------------------------------
# Role selection helper
# ---------------------------------------------------------------------------

async def resolve_role_entity(session: AsyncSession, email: str, role: str):
    """Fetch entity for a given role. Returns (entity, table_source) or raises."""
    if role == "admin":
        entity = await admin_repository.get_by_email(session, email)
        return entity, "admin"
    elif role == "instructor":
        entity = await instructor_repository.get_by_email(session, email)
        if entity and not entity.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your instructor account has been deactivated.",
            )
        return entity, "instructor"
    elif role == "student":
        entity = await user_repository.get_by_email(session, email)
        return entity, "user"
    return None, role
