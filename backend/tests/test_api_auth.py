"""
test_api_auth.py — Integration tests for the /auth HTTP endpoints.

Uses the AsyncClient + in-memory SQLite from conftest.py.
Google OAuth endpoints that call external services are NOT tested here
(they require live Google credentials). Use test_auth_service.py for
the underlying service logic instead.
"""
import pytest


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

async def test_health_check(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"



# ---------------------------------------------------------------------------
# GET /auth/login/google — just verify it redirects (no real Google call)
# ---------------------------------------------------------------------------

async def test_google_login_register_flow_redirects(client):
    r = await client.get("/auth/login/google?flow=register", follow_redirects=False)
    assert r.status_code in (302, 307)
    assert "accounts.google.com" in r.headers["location"]


async def test_google_login_login_flow_redirects(client):
    r = await client.get("/auth/login/google?flow=login", follow_redirects=False)
    assert r.status_code in (302, 307)
    assert "accounts.google.com" in r.headers["location"]


async def test_google_login_state_contains_flow(client):
    """The state param in the redirect URL must encode the flow."""
    r = await client.get("/auth/login/google?flow=register", follow_redirects=False)
    location = r.headers["location"]
    # Extract state param
    for part in location.split("&"):
        if part.startswith("state=") or "?state=" in part:
            state_value = part.split("state=")[-1]
            assert state_value.startswith("register:")
            break
