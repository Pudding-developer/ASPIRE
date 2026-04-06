"""
test_auth_service.py — Unit tests for auth_service functions.

Uses the in-memory SQLite session fixture from conftest.py.
"""
import pytest
from fastapi import HTTPException

from app.services.auth_service import (
    extract_sr_code,
    validate_email_domain,
)
from app.services.oauth_service import (
    build_google_auth_url,
    pop_state,
)



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
    valid, flow, _ = pop_state(state)
    assert valid is True
    assert flow == "register"


def test_pop_state_consumed_once():
    """State must be single-use."""
    _, state = build_google_auth_url(flow="login")
    pop_state(state)
    valid, _, _ = pop_state(state)
    assert valid is False


def test_pop_state_invalid():
    valid, flow, _ = pop_state("completely-fake-state")
    assert valid is False
    assert flow == "login"  # default fallback


