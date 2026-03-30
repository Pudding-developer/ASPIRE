"""
auth_routes.py — All authentication endpoints.

Routes:
  POST /auth/register        — local registration (email + password)
  POST /auth/login           — local login (sr_code + password)
  GET  /auth/login/google    — redirect to Google OAuth
  GET  /auth/callback        — Google OAuth callback (role-detecting)

Supported OAuth flows (via ?flow=):
  login               — existing student login
  register            — existing student registration
  instructor_register — new instructor registration via invite token
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import verify_access_token
from app.api.deps import security_scheme
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import select
from app.models.admin import Admin
from app.models.instructor import Instructor
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserRead, RoleSelectionRequest
from app.services.auth_service import (
    register_local_user,
    login_local_user,
    build_jwt,
    build_google_auth_url,
    pop_state,
    exchange_google_code,
    fetch_google_userinfo,
    google_login_flow,
    validate_email_domain,
    check_register_conflict,
    register_instructor_google,
    InstructorRegisterError,
)

router = APIRouter()

FRONTEND_CALLBACK_URL = "http://localhost:5173/auth/callback"
FRONTEND_REGISTER_URL = "http://localhost:5173/instructor/register"


# ---------------------------------------------------------------------------
# Local registration
# ---------------------------------------------------------------------------

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    session: AsyncSession = Depends(get_session),
):
    user = await register_local_user(session, data)
    token = build_jwt(user, "user")
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


# ---------------------------------------------------------------------------
# Local login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    session: AsyncSession = Depends(get_session),
):
    user = await login_local_user(session, data.sr_code, data.password)
    token = build_jwt(user, "user")
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


# ---------------------------------------------------------------------------
# Google OAuth — initiate
# ---------------------------------------------------------------------------

@router.get("/login/google")
async def google_login(flow: str = "login", token: str | None = None):
    """
    Redirect to Google's OAuth consent screen.

    ?flow=register            — Get Started path (student)
    ?flow=login               — Log In path (student)
    ?flow=instructor_register — Instructor invite-token registration
      also accepts ?token=xxxx (the invite token, embedded in OAuth state)
    """
    if flow not in ("register", "login", "instructor_register"):
        flow = "login"
    google_url, _ = build_google_auth_url(flow=flow, token=token)
    return RedirectResponse(url=google_url)


# ---------------------------------------------------------------------------
# Google OAuth — select role (multi-role flow)
# ---------------------------------------------------------------------------

@router.post("/login/select-role")
async def select_role(
    request: RoleSelectionRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
):
    """
    Exchanges a role_selection temporary JWT for the final authenticated JWT.
    """
    payload = verify_access_token(credentials.credentials)
    if not payload or payload.get("type") != "role_selection":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired role selection token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = payload.get("sub")
    roles_info = payload.get("roles", [])
    
    # Check if requested role is valid for this user
    target_role_info = next((r for r in roles_info if r["role"] == request.role), None)
    if not target_role_info:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{request.role}' is not available for this account.",
        )
    
    # Query the respective table
    entity = None
    table_source = request.role
    
    if request.role == "admin":
        result = await session.execute(select(Admin).where(Admin.email == email))
        entity = result.scalar_one_or_none()
    elif request.role == "instructor":
        result = await session.execute(select(Instructor).where(Instructor.email == email))
        entity = result.scalar_one_or_none()
        if entity and not entity.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your instructor account has been deactivated.",
            )
    elif request.role == "student":
        result = await session.execute(select(User).where(User.email == email))
        entity = result.scalar_one_or_none()
        table_source = "user"

    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found for the selected role.",
        )
    
    token = build_jwt(entity, table_source)
    return {"access_token": token, "redirect": target_role_info["redirect"]}


# ---------------------------------------------------------------------------
# Google OAuth — callback (unified role detection)
# ---------------------------------------------------------------------------

@router.get("/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Google redirects here. Handles three flows:
      - instructor_register — validate token, create instructor, issue JWT
      - register            — create student account
      - login               — find existing account by role
    """
    if error:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error={error}")

    if not code or not state:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=missing_params")

    # pop_state now returns a 3-tuple; state_token is only set for instructor_register
    valid, flow, state_token = pop_state(state)
    if not valid:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=invalid_state")

    try:
        token_data = await exchange_google_code(code)
        access_token = token_data["access_token"]
        google_user = await fetch_google_userinfo(access_token)

        # ------------------------------------------------------------------ #
        # instructor_register flow — token-gated, creates an instructor row   #
        # ------------------------------------------------------------------ #
        if flow == "instructor_register":
            try:
                jwt_token = await register_instructor_google(session, state_token, google_user)
                return RedirectResponse(
                    url=f"{FRONTEND_CALLBACK_URL}?token={jwt_token}&redirect=/instructor/dashboard"
                )
            except InstructorRegisterError as e:
                # Redirect back to the registration page with the original token
                # so the user can retry (except ALREADY_REGISTERED which goes to landing)
                token_param = f"&token={state_token}" if state_token else ""
                if e.code == "ALREADY_REGISTERED":
                    # No token to retry with — land them on the landing page
                    return RedirectResponse(
                        url=f"{FRONTEND_CALLBACK_URL}?error={e.code}"
                    )
                return RedirectResponse(
                    url=f"{FRONTEND_REGISTER_URL}?error={e.code}{token_param}"
                )

        # ------------------------------------------------------------------ #
        # Student register flow — check conflicts before creating             #
        # ------------------------------------------------------------------ #
        if flow == "register":
            exists = await check_register_conflict(session, google_user["email"].lower())
            if exists:
                return RedirectResponse(
                    url=f"{FRONTEND_CALLBACK_URL}?error=ACCOUNT_ALREADY_EXISTS"
                )

        # ------------------------------------------------------------------ #
        # Unified role detection (register + login)                           #
        # ------------------------------------------------------------------ #
        jwt_token, redirect_path = await google_login_flow(session, google_user, flow)
        return RedirectResponse(
            url=f"{FRONTEND_CALLBACK_URL}?token={jwt_token}&redirect={redirect_path}"
        )

    except HTTPException as e:
        error_code = e.headers.get("X-Error-Code") if e.headers else None
        error_param = error_code if error_code else str(e.detail).replace(" ", "_")
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error={error_param}")
    except Exception:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=server_error")
