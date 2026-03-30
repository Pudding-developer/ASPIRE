from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Instructor(SQLModel, table=True):
    """Instructor accounts — created via invite token, log in via Google."""
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    avatar_url: Optional[str] = Field(default=None)
    google_id: Optional[str] = Field(default=None)
    auth_provider: str = Field(default="google")
    role: str = Field(default="instructor")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.now)
