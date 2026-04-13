from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    """User table — stores both students and instructors."""
    id: Optional[int] = Field(default=None, primary_key=True)

    # Derived from the email prefix (e.g. "22-12345@g.batstate-u.edu.ph" → "22-12345")
    sr_code: str = Field(unique=True, index=True)

    email: str = Field(unique=True, index=True)
    full_name: str = Field(default="")
    role: str = Field(default="student")  # Always "student" on registration

    # Auth: null for Google users, bcrypt hash for local users
    hashed_password: Optional[str] = Field(default=None)

    # "local" or "google"
    auth_provider: str = Field(default="local")

    # Google OAuth fields
    google_id: Optional[str] = Field(default=None, unique=True, index=True)
    avatar_url: Optional[str] = Field(default=None)

    # Career tracking — set by student via PATCH /api/student/career
    chosen_career: Optional[str] = Field(default=None)
    career_chosen_at: Optional[datetime] = Field(default=None)
