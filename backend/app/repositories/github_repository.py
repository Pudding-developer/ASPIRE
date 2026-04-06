from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.github import GithubProfile, RepositoryCache, ContributionCache, AnalysisJob


# ---------------------------------------------------------------------------
# GithubProfile
# ---------------------------------------------------------------------------

async def get_profile(db: AsyncSession, user_id: int) -> GithubProfile | None:
    result = await db.execute(
        select(GithubProfile).where(GithubProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_profile_by_username(db: AsyncSession, username: str) -> GithubProfile | None:
    result = await db.execute(
        select(GithubProfile).where(GithubProfile.github_username == username)
    )
    return result.scalar_one_or_none()


async def create_profile(db: AsyncSession, **kwargs) -> GithubProfile:
    profile = GithubProfile(**kwargs)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def update_profile(db: AsyncSession, user_id: int, **kwargs) -> GithubProfile:
    profile = await get_profile(db, user_id)
    if not profile:
        raise ValueError(f"GithubProfile for user {user_id} not found")
    for key, value in kwargs.items():
        setattr(profile, key, value)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def delete_profile(db: AsyncSession, user_id: int) -> None:
    profile = await get_profile(db, user_id)
    if profile:
        await db.delete(profile)
        await db.commit()


# ---------------------------------------------------------------------------
# RepositoryCache
# ---------------------------------------------------------------------------

async def get_repos(db: AsyncSession, user_id: int) -> list[RepositoryCache]:
    result = await db.execute(
        select(RepositoryCache).where(RepositoryCache.user_id == user_id)
    )
    return result.scalars().all()


async def delete_repos(db: AsyncSession, user_id: int) -> None:
    result = await db.execute(
        select(RepositoryCache).where(RepositoryCache.user_id == user_id)
    )
    for repo in result.scalars().all():
        await db.delete(repo)
    await db.commit()


async def save_repos(db: AsyncSession, repos: list[RepositoryCache]) -> None:
    for repo in repos:
        db.add(repo)
    await db.commit()


# ---------------------------------------------------------------------------
# ContributionCache
# ---------------------------------------------------------------------------

async def get_contributions(db: AsyncSession, user_id: int) -> ContributionCache | None:
    result = await db.execute(
        select(ContributionCache).where(ContributionCache.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def delete_contributions(db: AsyncSession, user_id: int) -> None:
    result = await db.execute(
        select(ContributionCache).where(ContributionCache.user_id == user_id)
    )
    for contrib in result.scalars().all():
        await db.delete(contrib)
    await db.commit()


async def save_contributions(db: AsyncSession, **kwargs) -> ContributionCache:
    contrib = ContributionCache(**kwargs)
    db.add(contrib)
    await db.commit()
    await db.refresh(contrib)
    return contrib


# ---------------------------------------------------------------------------
# AnalysisJob
# ---------------------------------------------------------------------------

async def get_job(db: AsyncSession, job_id: str) -> AnalysisJob | None:
    return await db.get(AnalysisJob, job_id)


async def get_running_job(db: AsyncSession, user_id: int) -> AnalysisJob | None:
    result = await db.execute(
        select(AnalysisJob).where(
            AnalysisJob.user_id == user_id,
            AnalysisJob.status.in_(["pending", "running"]),
        )
    )
    return result.scalar_one_or_none()


async def create_job(db: AsyncSession, job_id: str, user_id: int) -> AnalysisJob:
    job = AnalysisJob(
        id=job_id,
        user_id=user_id,
        status="pending",
        started_at=datetime.now(),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job


async def update_job(db: AsyncSession, job_id: str, **kwargs) -> AnalysisJob:
    job = await get_job(db, job_id)
    if not job:
        raise ValueError(f"AnalysisJob {job_id} not found")
    for key, value in kwargs.items():
        setattr(job, key, value)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return job
