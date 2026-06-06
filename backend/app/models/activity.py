"""
activity.py — User-facing activity feed events.

One row per event displayed to a user (System Feed card, Bell dropdown,
"View all activities" page). Emitted by services on meaningful state
changes: grade released, career report updated, GitHub repo synced,
skill milestone reached, etc.
"""
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class ActivityEvent(SQLModel, table=True):
    __tablename__ = "activity_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    type: str = Field(index=True)
    # e.g. "grade_released" | "career_updated" | "github_synced" | "skill_milestone"
    title: str
    subtitle: str = Field(default="")
    payload_json: str = Field(default="{}")
    read_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
