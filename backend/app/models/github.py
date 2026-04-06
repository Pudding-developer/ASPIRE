from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class GithubProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    github_username: str = Field(index=True)
    github_access_token: str
    github_avatar_url: Optional[str] = None
    github_bio: Optional[str] = None
    public_repos_count: int = Field(default=0)
    followers_count: int = Field(default=0)
    github_created_at: Optional[datetime] = None
    connected_at: datetime = Field(default_factory=datetime.now)
    last_analyzed: Optional[datetime] = None


class RepositoryCache(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    repo_name: str
    repo_full_name: str
    description: Optional[str] = None
    primary_language: Optional[str] = None
    languages_json: str = Field(default="{}")
    topics_json: str = Field(default="[]")
    dependencies_json: str = Field(default="{}")
    stargazer_count: int = Field(default=0)
    fork_count: int = Field(default=0)
    commit_count: int = Field(default=0)
    is_pinned: bool = Field(default=False)
    pushed_at: Optional[datetime] = None
    cached_at: datetime = Field(default_factory=datetime.now)


class ContributionCache(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    total_contributions: int = Field(default=0)
    total_commits: int = Field(default=0)
    current_streak: int = Field(default=0)
    longest_streak: int = Field(default=0)
    calendar_json: str = Field(default="[]")
    cached_at: datetime = Field(default_factory=datetime.now)


class AnalysisJob(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    status: str = Field(default="pending")
    current_step: int = Field(default=0)
    current_step_label: str = Field(default="")
    percentage: int = Field(default=0)
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
