from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class InstructorInviteToken(SQLModel, table=True):
    """One-time invite tokens used to register instructor accounts."""
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(unique=True, index=True)
    assigned_email: Optional[str] = Field(default=None)  # If set, only this email can use it
    is_used: bool = Field(default=False)
    used_by_email: Optional[str] = Field(default=None)
    used_at: Optional[datetime] = Field(default=None)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.now)
