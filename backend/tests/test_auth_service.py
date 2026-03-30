"""
test_auth_service.py — Unit tests for auth_service functions.

Uses the in-memory SQLite session fixture from conftest.py.
"""
import pytest
from fastapi import HTTPException

from app.services.auth_service import (
    hash_password,
    verify_password,
    extract_sr_code,
    validate_email_domain,
    register_local_user,
    login_local_user,
    build_google_auth_url,
    pop_state,
)
from app.schemas.user import UserRegister


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def test_hash_and_verify_password():
    hashed = hash_password("supersecret")
    assert verify_password("supersecret", hashed) is True
    assert verify_password("wrongpassword", hashed) is False


# ---------------------------------------------------------------------------
# Email / SR code helpers
# ---------------------------------------------------------------------------

def test_extract_sr_code():
    assert extract_sr_code("22-12345@g.batstate-u.edu.ph") == "22-12345"


def test_validate_email_domain_passes():
    # Should not raise for a valid domain
    validate_email_domain("22-99999@g.batstate-u.edu.ph")


def test_validate_email_domain_fails():
    with pytest.raises(HTTPException) as exc_info:
        validate_email_domain("hacker@gmail.com")
    assert exc_info.value.status_code == 403


# ---------------------------------------------------------------------------
# OAuth state helpers
# ---------------------------------------------------------------------------

def test_build_google_auth_url_register_flow():
    url, state = build_google_auth_url(flow="register")
    assert "accounts.google.com" in url
    assert state.startswith("register:")


def test_build_google_auth_url_login_flow():
    url, state = build_google_auth_url(flow="login")
    assert state.startswith("login:")


def test_pop_state_valid():
    _, state = build_google_auth_url(flow="register")
    valid, flow = pop_state(state)
    assert valid is True
    assert flow == "register"


def test_pop_state_consumed_once():
    """State must be single-use."""
    _, state = build_google_auth_url(flow="login")
    pop_state(state)
    valid, _ = pop_state(state)
    assert valid is False


def test_pop_state_invalid():
    valid, flow = pop_state("completely-fake-state")
    assert valid is False
    assert flow == "login"  # default fallback


# ---------------------------------------------------------------------------
# Local registration
# ---------------------------------------------------------------------------

VALID_REGISTER_DATA = UserRegister(
    email="22-12345@g.batstate-u.edu.ph",
    full_name="Juan dela Cruz",
    password="TestPass123!",
    confirm_password="TestPass123!",
)


async def test_register_local_user_success(session):
    user = await register_local_user(session, VALID_REGISTER_DATA)
    assert user.id is not None
    assert user.email == "22-12345@g.batstate-u.edu.ph"
    assert user.sr_code == "22-12345"
    assert user.role == "student"
    assert user.auth_provider == "local"


async def test_register_duplicate_email_raises_409(session):
    await register_local_user(session, VALID_REGISTER_DATA)
    with pytest.raises(HTTPException) as exc_info:
        await register_local_user(session, VALID_REGISTER_DATA)
    assert exc_info.value.status_code == 409


async def test_register_password_mismatch_raises_400(session):
    bad_data = UserRegister(
        email="22-99999@g.batstate-u.edu.ph",
        full_name="Test User",
        password="abc123",
        confirm_password="different",
    )
    with pytest.raises(HTTPException) as exc_info:
        await register_local_user(session, bad_data)
    assert exc_info.value.status_code == 400


# ---------------------------------------------------------------------------
# Local login
# ---------------------------------------------------------------------------

async def test_login_local_user_success(session):
    await register_local_user(session, VALID_REGISTER_DATA)
    user = await login_local_user(session, "22-12345", "TestPass123!")
    assert user.sr_code == "22-12345"


async def test_login_wrong_password_raises_401(session):
    await register_local_user(session, VALID_REGISTER_DATA)
    with pytest.raises(HTTPException) as exc_info:
        await login_local_user(session, "22-12345", "wrongpassword")
    assert exc_info.value.status_code == 401


async def test_login_nonexistent_user_raises_401(session):
    with pytest.raises(HTTPException) as exc_info:
        await login_local_user(session, "00-00000", "anything")
    assert exc_info.value.status_code == 401
