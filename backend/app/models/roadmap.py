from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class RoadmapCache(SQLModel, table=True):
    __tablename__ = "roadmap_cache"
    id: Optional[int] = Field(default=None, primary_key=True)
    career_slug: str = Field(unique=True, index=True)
    nodes_json: str
    cached_at: datetime = Field(default_factory=datetime.utcnow)
