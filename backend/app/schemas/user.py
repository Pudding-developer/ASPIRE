from pydantic import BaseModel, field_validator
from typing import Optional


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------




class RoleSelectionRequest(BaseModel):
    """Schema for selecting a role when multiple roles are available."""
    role: str

class LocalRegisterRequest(BaseModel):
    """Schema for local registration."""
    first_name: str
    last_name: str
    sr_code: str
    email: str
    password: str

class LocalLoginRequest(BaseModel):
    """Schema for local login."""
    email: str
    password: str


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
