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
# POST /auth/register
# ---------------------------------------------------------------------------

REGISTER_PAYLOAD = {
    "email": "22-12345@g.batstate-u.edu.ph",
    "full_name": "Juan dela Cruz",
    "password": "TestPass123!",
    "confirm_password": "TestPass123!",
}


async def test_register_returns_201_and_token(client):
    r = await client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "student"
    assert data["user"]["sr_code"] == "22-12345"


async def test_register_duplicate_returns_409(client):
    await client.post("/auth/register", json=REGISTER_PAYLOAD)
    r = await client.post("/auth/register", json=REGISTER_PAYLOAD)
    assert r.status_code == 409


async def test_register_wrong_domain_returns_422(client):
    bad_payload = {**REGISTER_PAYLOAD, "email": "hacker@gmail.com"}
    r = await client.post("/auth/register", json=bad_payload)
    assert r.status_code == 422


async def test_register_password_mismatch_returns_400(client):
    bad_payload = {**REGISTER_PAYLOAD, "confirm_password": "differentpassword"}
    r = await client.post("/auth/register", json=bad_payload)
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

async def test_login_returns_200_and_token(client):
    await client.post("/auth/register", json=REGISTER_PAYLOAD)
    r = await client.post("/auth/login", json={
        "sr_code": "22-12345",
        "password": "TestPass123!",
    })
    assert r.status_code == 200
    assert "access_token" in r.json()


async def test_login_wrong_password_returns_401(client):
    await client.post("/auth/register", json=REGISTER_PAYLOAD)
    r = await client.post("/auth/login", json={
        "sr_code": "22-12345",
        "password": "wrongpassword",
    })
    assert r.status_code == 401


async def test_login_nonexistent_user_returns_401(client):
    r = await client.post("/auth/login", json={
        "sr_code": "00-00000",
        "password": "anything",
    })
    assert r.status_code == 401


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
