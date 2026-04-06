"""
oauth_service.py — Google OAuth state management and token exchange.
"""
import secrets

import httpx

from app.core.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

_oauth_states: set[str] = set()


def build_google_auth_url(flow: str = "login", token: str | None = None) -> tuple[str, str]:
    """Build Google OAuth URL with CSRF state. Returns (url, state)."""
    random_part = secrets.token_urlsafe(32)
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
    """
    if state in _oauth_states:
        _oauth_states.discard(state)
        parts = state.split(":", 2)
        flow = parts[0] if len(parts) >= 1 else "login"
        if flow == "instructor_register" and len(parts) == 3:
            return True, flow, parts[1]
        return True, flow, None
    return False, "login", None


async def exchange_google_code(code: str) -> dict:
    """Exchange authorization code for Google tokens."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
    if resp.status_code != 200:
        raise Exception("Failed to exchange code with Google.")
    return resp.json()


async def fetch_google_userinfo(access_token: str) -> dict:
    """Fetch Google user profile info."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if resp.status_code != 200:
        raise Exception("Failed to fetch user info from Google.")
    return resp.json()
