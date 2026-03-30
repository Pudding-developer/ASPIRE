"""
auth_service.py — All authentication business logic.
"""
import secrets
from datetime import datetime
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import asyncio
from app.services.email_service import send_student_welcome, send_instructor_welcome

from app.core.config import (
    ALLOWED_EMAIL_DOMAIN,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)
from app.core.security import create_access_token
from app.models.user import User
from app.models.instructor import Instructor
from app.models.admin import Admin
from app.models.instructor_invite_token import InstructorInviteToken
from app.schemas.user import UserRegister


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class InstructorRegisterError(Exception):
    """Raised during instructor_register OAuth flow to signal a specific error code."""
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


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


def build_jwt(entity, table_source: str) -> str:
    return create_access_token(data={
        "sub": str(entity.id),
        "user_id": entity.id,
        "email": entity.email,
        "role": entity.role,
        "auth_provider": entity.auth_provider if hasattr(entity, "auth_provider") else "google",
        "full_name": entity.full_name,
        "avatar_url": entity.avatar_url or "",
        "table_source": table_source,
    })


# ---------------------------------------------------------------------------
# Local registration (student)
# ---------------------------------------------------------------------------

async def register_local_user(session: AsyncSession, data: UserRegister) -> User:
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    result = await session.execute(select(User).where(User.email == data.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    sr_code = extract_sr_code(data.email)
    result = await session.execute(select(User).where(User.sr_code == sr_code))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An account with this SR code already exists.")

    user = User(
        email=data.email.lower(),
        sr_code=sr_code,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role="student",
        auth_provider="local",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Local login (student)
# ---------------------------------------------------------------------------

async def login_local_user(session: AsyncSession, sr_code: str, password: str) -> User:
    result = await session.execute(select(User).where(User.sr_code == sr_code))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid SR code or password.")

    if user.auth_provider == "google":
        raise HTTPException(status_code=400, detail="This account was created with Google.")

    if not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid SR code or password.")

    return user


# ---------------------------------------------------------------------------
# Google OAuth — state management
# ---------------------------------------------------------------------------

_oauth_states: set[str] = set()
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"


def build_google_auth_url(flow: str = "login", token: str | None = None) -> tuple[str, str]:
    random_part = secrets.token_urlsafe(32)
    # For instructor_register: embed the invite token in state so it survives the redirect round-trip.
    # State format: "instructor_register:{invite_token}:{random}"  (3 segments)
    # All other flows:          "{flow}:{random}"                   (2 segments)
    if flow == "instructor_register" and token:
        state = f"{flow}:{token}:{random_part}"
    else:
        state = f"{flow}:{random_part}"
    _oauth_states.add(state)
    params = "&".join([
        f"client_id={GOOGLE_CLIENT_ID}",
        f"redirect_uri={GOOGLE_REDIRECT_URI}",
        "response_type=code",
        "scope=openid%20email%20profile",
        "access_type=offline",
        f"state={state}",
        "prompt=select_account",
    ])
    return f"{GOOGLE_AUTH_URL}?{params}", state


def pop_state(state: str) -> tuple[bool, str, str | None]:
    """
    Validate and consume an OAuth state token.
    Returns (valid, flow, invite_token_or_None).
    invite_token is only present for flow=instructor_register.
    """
    if state in _oauth_states:
        _oauth_states.discard(state)
        parts = state.split(":", 2)  # At most 3 parts
        flow = parts[0] if len(parts) >= 1 else "login"
        if flow == "instructor_register" and len(parts) == 3:
            # parts = ["instructor_register", invite_token, random]
            return True, flow, parts[1]
        return True, flow, None
    return False, "login", None


# ---------------------------------------------------------------------------
# Google OAuth — exchange code + fetch profile
# ---------------------------------------------------------------------------

import httpx

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


async def exchange_google_code(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code with Google.")
    return resp.json()


async def fetch_google_userinfo(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google.")
    return resp.json()


# ---------------------------------------------------------------------------
# Google OAuth — unified role-detection login flow
# ---------------------------------------------------------------------------

async def google_login_flow(
    session: AsyncSession,
    google_user: dict,
    flow: str,
) -> tuple[str, str]:
    """
    Detects the user's role by checking tables: Admin, Instructor, User.
    If multiple roles are found, issues a temporary role selection token.

    Returns (jwt_token, redirect_path).
    Raises HTTPException for blocked/not-found cases.
    """
    email = google_user["email"].lower()
    google_id = str(google_user["id"])
    full_name = (
        f"{google_user.get('given_name', '')} {google_user.get('family_name', '')}".strip()
        or google_user.get("name", "")
    )
    avatar_url = google_user.get("picture", "")

    found_roles = []

    # Step 1 — Admin
    result = await session.execute(select(Admin).where(Admin.email == email))
    admin = result.scalar_one_or_none()
    if admin:
        # Refresh Google profile
        admin.google_id = google_id
        admin.avatar_url = avatar_url
        admin.full_name = full_name
        session.add(admin)
        found_roles.append({"role": "admin", "redirect": "/admin/dashboard", "entity": admin, "table_source": "admin"})

    # Step 2 — Instructor
    result = await session.execute(select(Instructor).where(Instructor.email == email))
    instructor = result.scalar_one_or_none()
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

    # Step 3 — Student (user table)
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        user.google_id = google_id
        user.avatar_url = avatar_url
        session.add(user)
        found_roles.append({"role": "student", "redirect": "/student/dashboard", "entity": user, "table_source": "user"})

    # Commit any google profile updates
    if found_roles:
        await session.commit()
        for r in found_roles:
            await session.refresh(r["entity"])

    # Step 4 — Not found in any table
    if not found_roles and flow == "login":
        raise HTTPException(
            status_code=404,
            detail="No account found. Please use Get Started to register.",
            headers={"X-Error-Code": "ACCOUNT_NOT_FOUND"},
        )

    # flow == "register" — create student
    if not found_roles and flow == "register":
        validate_email_domain(email)
        sr_code = extract_sr_code(email)
        new_user = User(
            email=email,
            sr_code=sr_code,
            full_name=full_name,
            google_id=google_id,
            avatar_url=avatar_url,
            role="student",
            auth_provider="google",
            hashed_password=None,
        )
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        # Dispatch background welcome email
        asyncio.create_task(send_student_welcome(email, full_name))
        
        found_roles.append({"role": "student", "redirect": "/student/dashboard", "entity": new_user, "table_source": "user"})

    # Handle multiple roles
    if len(found_roles) == 1:
        # Single role — auto login
        role_data = found_roles[0]
        token = build_jwt(role_data["entity"], role_data["table_source"])
        return token, role_data["redirect"]

    # Multiple roles — issue a selection token
    from datetime import timedelta
    roles_info = [{"role": r["role"], "redirect": r["redirect"]} for r in found_roles]
    selection_token = create_access_token(
        data={
            "sub": email,
            "type": "role_selection",
            "full_name": full_name,
            "avatar_url": avatar_url,
            "roles": roles_info
        },
        expires_delta=timedelta(minutes=15)
    )
    return selection_token, "/auth/select-role"


async def check_register_conflict(session: AsyncSession, email: str) -> bool:
    """Returns True if email is already in any table (for register flow 409 check)."""
    for model in (Admin, Instructor, User):
        result = await session.execute(select(model).where(model.email == email))
        if result.scalar_one_or_none():
            return True
    return False


# ---------------------------------------------------------------------------
# Instructor registration via Google OAuth
# ---------------------------------------------------------------------------

async def register_instructor_google(
    session: AsyncSession,
    token_str: str | None,
    google_user: dict,
) -> str:
    """
    Full instructor registration flow triggered from the OAuth callback.

    Steps:
      1. Validate token (exists, not used, not expired)  → INVALID_TOKEN
      2. Validate email domain (@g.batstate-u.edu.ph)    → EMAIL_NOT_ALLOWED
      3. Enforce assigned_email if set                   → EMAIL_MISMATCH
      4. Check for existing instructor row               → ALREADY_REGISTERED
      5. Atomically create instructor + mark token used
      6. Build and return signed JWT

    Raises InstructorRegisterError on any validation failure.
    Returns the signed JWT string on success.
    """
    # Step 1 — Validate token
    if not token_str:
        raise InstructorRegisterError("INVALID_TOKEN")

    result = await session.execute(
        select(InstructorInviteToken).where(InstructorInviteToken.token == token_str)
    )
    invite = result.scalar_one_or_none()
    # Always use the same error code — never reveal which condition triggered
    if not invite or invite.is_used or invite.expires_at < datetime.now():
        raise InstructorRegisterError("INVALID_TOKEN")

    # Step 2 — Validate email domain
    email = google_user["email"].lower()
    domain = ALLOWED_EMAIL_DOMAIN or "g.batstate-u.edu.ph"
    if not email.endswith(f"@{domain}"):
        raise InstructorRegisterError("EMAIL_NOT_ALLOWED")

    # Step 3 — Enforce assigned_email if set
    if invite.assigned_email and invite.assigned_email.lower() != email:
        raise InstructorRegisterError("EMAIL_MISMATCH")

    # Step 4 — Check for duplicate instructor
    result = await session.execute(
        select(Instructor).where(Instructor.email == email)
    )
    if result.scalar_one_or_none():
        raise InstructorRegisterError("ALREADY_REGISTERED")

    # Step 5 — Atomic create + token consumption
    given_name = google_user.get("given_name", "")
    family_name = google_user.get("family_name", "")
    full_name = f"{given_name} {family_name}".strip() or google_user.get("name", "")
    google_id = str(google_user.get("id", ""))
    avatar_url = google_user.get("picture", "")

    now = datetime.now()
    instructor = Instructor(
        email=email,
        full_name=full_name,
        avatar_url=avatar_url or None,
        google_id=google_id or None,
        auth_provider="google",
        role="instructor",
        is_active=True,
        created_at=now,
    )
    session.add(instructor)

    # Mark token consumed in the same transaction — rolls back if commit fails
    invite.is_used = True
    invite.used_by_email = email
    invite.used_at = now
    session.add(invite)

    await session.commit()
    await session.refresh(instructor)

    # Dispatch background welcome email
    asyncio.create_task(send_instructor_welcome(email, full_name))

    # Step 6 — Issue JWT
    return build_jwt(instructor, "instructor")


# ---------------------------------------------------------------------------
# Legacy upsert (kept for backwards compatibility if needed)
# ---------------------------------------------------------------------------

async def upsert_google_user(session: AsyncSession, google_user: dict) -> User:
    email = google_user["email"].lower()
    google_id = str(google_user["id"])
    given_name = google_user.get("given_name", "")
    family_name = google_user.get("family_name", "")
    full_name = f"{given_name} {family_name}".strip() or google_user.get("name", "")
    avatar_url = google_user.get("picture", "")
    sr_code = extract_sr_code(email)

    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        user.full_name = full_name
        user.google_id = google_id
        user.avatar_url = avatar_url
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    user = User(
        email=email,
        sr_code=sr_code,
        full_name=full_name,
        google_id=google_id,
        avatar_url=avatar_url,
        role="student",
        auth_provider="google",
        hashed_password=None,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
