from pydantic import BaseModel, field_validator
from typing import Optional


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    """Schema for local (email/password) registration."""
    email: str
    full_name: str
    password: str
    confirm_password: str

    @field_validator("email")
    @classmethod
    def email_must_be_institution(cls, v: str) -> str:
        from app.core.config import ALLOWED_EMAIL_DOMAIN
        domain = ALLOWED_EMAIL_DOMAIN or "g.batstate-u.edu.ph"
        if not v.endswith(f"@{domain}"):
            raise ValueError(f"Only @{domain} email addresses are allowed.")
        return v.lower()


class UserLogin(BaseModel):
    """Schema for local (sr_code/password) login."""
    sr_code: str
    password: str



class RoleSelectionRequest(BaseModel):
    """Schema for selecting a role when multiple roles are available."""
    role: str


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class UserRead(BaseModel):
    """Public representation of a user."""
    id: int
    sr_code: str
    email: str
    full_name: str
    role: str
    auth_provider: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserRead


# ---------------------------------------------------------------------------
# Legacy schemas (kept for backwards compatibility)
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    username: str
    email: str
    role: str = "student"


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
