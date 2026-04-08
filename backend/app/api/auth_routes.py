"""
auth_routes.py — All authentication endpoints.

Routes call services only — no direct DB queries or business logic.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)

from app.core.database import get_session
from app.api.deps import security_scheme
from app.schemas.user import TokenResponse, UserRead, RoleSelectionRequest
from app.services.token_service import build_jwt, verify_access_token
from app.services.oauth_service import (
    build_google_auth_url,
    pop_state,
    exchange_google_code,
    fetch_google_userinfo,
)
from app.services.auth_service import (
    google_login_flow,
    check_register_conflict,
    register_instructor_google,
    resolve_role_entity,
    InstructorRegisterError,
)

router = APIRouter()

FRONTEND_CALLBACK_URL = "http://localhost:5173/auth/callback"
FRONTEND_REGISTER_URL = "http://localhost:5173/instructor/register"



@router.get("/login/google")
async def google_login(flow: str = "login", token: str | None = None):
    if flow not in ("register", "login", "instructor_register"):
        flow = "login"
    google_url, _ = build_google_auth_url(flow=flow, token=token)
    return RedirectResponse(url=google_url)


@router.post("/login/select-role")
async def select_role(
    request: RoleSelectionRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    session: AsyncSession = Depends(get_session),
):
    payload = verify_access_token(credentials.credentials)
    if not payload or payload.get("type") != "role_selection":
        raise HTTPException(status_code=401, detail="Invalid or expired role selection token.")

    roles_info = payload.get("roles", [])
    target = next((r for r in roles_info if r["role"] == request.role), None)
    if not target:
        raise HTTPException(status_code=403, detail=f"Role '{request.role}' is not available.")

    entity, table_source = await resolve_role_entity(session, payload["sub"], request.role)
    if not entity:
        raise HTTPException(status_code=404, detail="Account not found for the selected role.")

    token = build_jwt(entity, table_source)
    return {"access_token": token, "redirect": target["redirect"]}


@router.get("/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    if error:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error={error}")
    if not code or not state:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=missing_params")

    valid, flow, state_token = pop_state(state)
    if not valid:
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=invalid_state")

    try:
        token_data = await exchange_google_code(code)
        google_user = await fetch_google_userinfo(token_data["access_token"])

        if flow == "instructor_register":
            try:
                jwt_token = await register_instructor_google(session, state_token, google_user)
                return RedirectResponse(
                    url=f"{FRONTEND_CALLBACK_URL}?token={jwt_token}&redirect=/instructor/dashboard"
                )
            except InstructorRegisterError as e:
                token_param = f"&token={state_token}" if state_token else ""
                if e.code == "ALREADY_REGISTERED":
                    return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error={e.code}")
                return RedirectResponse(url=f"{FRONTEND_REGISTER_URL}?error={e.code}{token_param}")

        if flow == "register":
            if await check_register_conflict(session, google_user["email"].lower()):
                return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=ACCOUNT_ALREADY_EXISTS")

        jwt_token, redirect_path = await google_login_flow(session, google_user, flow)
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?token={jwt_token}&redirect={redirect_path}")

    except HTTPException as e:
        error_code = e.headers.get("X-Error-Code") if e.headers else None
        error_param = error_code if error_code else str(e.detail).replace(" ", "_")
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error={error_param}")
    except Exception:
        logger.exception("[OAuth Callback] Unhandled exception during Google login")
        return RedirectResponse(url=f"{FRONTEND_CALLBACK_URL}?error=server_error")
