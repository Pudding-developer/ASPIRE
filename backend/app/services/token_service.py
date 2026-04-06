"""
token_service.py — JWT token creation and verification.
"""
from datetime import timedelta

from app.core.security import create_access_token, verify_access_token  # noqa: F401


def build_jwt_payload(entity, table_source: str) -> dict:
    """Build the standard JWT payload dict from a user/instructor/admin entity."""
    return {
        "sub": str(entity.id),
        "user_id": entity.id,
        "email": entity.email,
        "role": entity.role,
        "auth_provider": entity.auth_provider if hasattr(entity, "auth_provider") else "google",
        "full_name": entity.full_name,
        "avatar_url": entity.avatar_url or "",
        "table_source": table_source,
    }


def build_jwt(entity, table_source: str) -> str:
    """Build and sign a JWT for the given entity."""
    return create_access_token(data=build_jwt_payload(entity, table_source))


def create_temp_token(payload: dict, minutes: int = 15) -> str:
    """Create a short-lived temporary token (e.g. for role selection)."""
    return create_access_token(data=payload, expires_delta=timedelta(minutes=minutes))
