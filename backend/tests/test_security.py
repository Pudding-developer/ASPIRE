"""
test_security.py — Unit tests for JWT create/verify logic (no DB needed).
"""
import time
from app.core.security import create_access_token, verify_access_token


def test_create_and_verify_token():
    """A freshly created token should decode back to the original payload."""
    payload = {"sub": "42", "user_id": 42, "role": "student", "email": "22-99999@g.batstate-u.edu.ph"}
    token = create_access_token(payload)
    decoded = verify_access_token(token)

    assert decoded is not None
    assert decoded["sub"] == "42"
    assert decoded["role"] == "student"
    assert decoded["email"] == "22-99999@g.batstate-u.edu.ph"


def test_verify_invalid_token_returns_none():
    """A garbage string should return None, not raise."""
    result = verify_access_token("this.is.not.a.valid.token")
    assert result is None


def test_verify_tampered_token_returns_none():
    """Modifying the token should invalidate the signature."""
    token = create_access_token({"sub": "1"})
    tampered = token[:-5] + "XXXXX"
    assert verify_access_token(tampered) is None


def test_expired_token_returns_none():
    """A token with a past expiry should fail verification."""
    from datetime import timedelta
    token = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
    assert verify_access_token(token) is None
