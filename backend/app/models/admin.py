from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Admin(SQLModel, table=True):
    """Admin accounts — seeded via script, log in via Google."""
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    avatar_url: Optional[str] = Field(default=None)
    google_id: Optional[str] = Field(default=None)
    role: str = Field(default="admin")
    created_at: datetime = Field(default_factory=datetime.now)
