"""
auth_service.py — All authentication business logic.

Two paths:
  1. Local (email/password) — register + login via sr_code
  2. Google OAuth — using Authlib
"""
import secrets
from passlib.context import CryptContext
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import (
    ALLOWED_EMAIL_DOMAIN,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.user import UserRegister

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
    """Extract SR code from email prefix. e.g. '22-12345@g.batstate-u.edu.ph' → '22-12345'."""
    return email.split("@")[0]


def validate_email_domain(email: str) -> None:
    domain = ALLOWED_EMAIL_DOMAIN or "g.batstate-u.edu.ph"
    if not email.lower().endswith(f"@{domain}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only @{domain} email addresses are allowed.",
        )


def build_jwt(user: User) -> str:
    return create_access_token(data={
        "sub": str(user.id),
        "user_id": user.id,
        "sr_code": user.sr_code,
        "email": user.email,
        "role": user.role,
        "auth_provider": user.auth_provider,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url or "",
    })


# ---------------------------------------------------------------------------
# Local registration
# ---------------------------------------------------------------------------

async def register_local_user(session: AsyncSession, data: UserRegister) -> User:
    """Register a new user with email + password (local auth)."""
    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    # Check duplicate email
    result = await session.execute(select(User).where(User.email == data.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    sr_code = extract_sr_code(data.email)

    # Check duplicate SR code
    result = await session.execute(select(User).where(User.sr_code == sr_code))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this SR code already exists.",
        )

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
# Local login
# ---------------------------------------------------------------------------

async def login_local_user(session: AsyncSession, sr_code: str, password: str) -> User:
    """Authenticate a user by sr_code + password."""
    result = await session.execute(select(User).where(User.sr_code == sr_code))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid SR code or password.",
        )

    if user.auth_provider == "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was created with Google. Please use 'Continue with Google' to log in.",
        )

    if not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid SR code or password.",
        )

    return user


# ---------------------------------------------------------------------------
# Google OAuth — build auth URL
# ---------------------------------------------------------------------------

# In-memory CSRF state store (use Redis in production)
_oauth_states: set[str] = set()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"


def build_google_auth_url() -> tuple[str, str]:
    state = secrets.token_urlsafe(32)
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


def pop_state(state: str) -> bool:
    """Returns True if state is valid and removes it."""
    if state in _oauth_states:
        _oauth_states.discard(state)
        return True
    return False


# ---------------------------------------------------------------------------
# Google OAuth — exchange code + upsert user
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


async def upsert_google_user(session: AsyncSession, google_user: dict) -> User:
    """Create or update a user from Google OAuth profile data."""
    email = google_user["email"].lower()
    google_id = str(google_user["id"])
    given_name = google_user.get("given_name", "")
    family_name = google_user.get("family_name", "")
    full_name = f"{given_name} {family_name}".strip() or google_user.get("name", "")
    avatar_url = google_user.get("picture", "")
    sr_code = extract_sr_code(email)

    # Try to find existing user by email
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        # Update name and Google fields
        user.full_name = full_name
        user.google_id = google_id
        user.avatar_url = avatar_url
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    # Create new Google user
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
