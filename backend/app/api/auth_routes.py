"""
auth_routes.py — All authentication endpoints.

Routes:
  POST /auth/register        — local registration (email + password)
  POST /auth/login           — local login (sr_code + password)
  GET  /auth/login/google    — redirect to Google OAuth
  GET  /auth/callback        — Google OAuth callback
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserRead
from app.services.auth_service import (
    register_local_user,
    login_local_user,
    build_jwt,
    build_google_auth_url,
    pop_state,
    exchange_google_code,
    fetch_google_userinfo,
    upsert_google_user,
    validate_email_domain,
)

router = APIRouter()

FRONTEND_CALLBACK_URL = "http://localhost:5173/auth/callback"


# ---------------------------------------------------------------------------
# Local registration
# ---------------------------------------------------------------------------

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    session: AsyncSession = Depends(get_session),
):
    """
    Register a new student account with email + password.
    - Email must end in the allowed domain (e.g. @g.batstate-u.edu.ph)
    - SR code is extracted automatically from the email prefix
    - Role is always 'student'
    """
    user = await register_local_user(session, data)
    token = build_jwt(user)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


# ---------------------------------------------------------------------------
# Local login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    session: AsyncSession = Depends(get_session),
):
    """
    Log in with SR code and password.
    - Returns 400 if the account was created via Google (prompts Google login)
    - Returns 401 for invalid credentials
    """
    user = await login_local_user(session, data.sr_code, data.password)
    token = build_jwt(user)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


# ---------------------------------------------------------------------------
# Google OAuth — initiate
# ---------------------------------------------------------------------------

@router.get("/login/google")
async def google_login():
    """
    Redirect the user to Google's OAuth consent screen.
    Frontend calls this to initiate Google sign-in.
    """
    google_url, _ = build_google_auth_url()
    return RedirectResponse(url=google_url)


# ---------------------------------------------------------------------------
# Google OAuth — callback
# ---------------------------------------------------------------------------

@router.get("/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Google redirects here after the user approves.
    - Validates CSRF state
    - Exchanges code for tokens
    - Fetches user profile from Google
    - Validates email domain
    - Creates or updates user in DB
    - Issues JWT and redirects to frontend
    """
    if error:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error={error}")

    if not code or not state:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=missing_params")

    # CSRF state validation
    if not pop_state(state):
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=invalid_state")

    try:
        # Exchange code for Google tokens
        token_data = await exchange_google_code(code)
        access_token = token_data["access_token"]

        # Fetch user profile from Google
        google_user = await fetch_google_userinfo(access_token)

        # Enforce institution email domain
        validate_email_domain(google_user["email"])

        # Create or update user in DB
        user = await upsert_google_user(session, google_user)

        # Issue our own JWT
        jwt_token = build_jwt(user)

        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?token={jwt_token}")

    except HTTPException as e:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error={e.detail}")
    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=server_error")
