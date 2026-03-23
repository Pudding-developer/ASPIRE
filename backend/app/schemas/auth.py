from pydantic import BaseModel
from typing import Optional


class TokenResponse(BaseModel):
    """Returned to the frontend after successful OAuth login."""
    access_token: str
    token_type: str = "bearer"


class UserReadFromToken(BaseModel):
    """The user data embedded inside the JWT payload."""
    id: int
    email: str
    role: str
    full_name: str
    avatar_url: Optional[str] = None
