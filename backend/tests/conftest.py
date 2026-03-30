"""
conftest.py — Shared fixtures for all tests.

Uses an in-memory SQLite database so tests never touch your real PostgreSQL.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

# Must import models so their metadata is registered before create_all
import app.models  # noqa: F401
from app.core.database import get_session
from main import app

# ---------------------------------------------------------------------------
# In-memory SQLite engine (no real DB required)
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
TestSessionFactory = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture
async def session():
    """Provide a clean async DB session for each test."""
    async with TestSessionFactory() as s:
        yield s


@pytest.fixture
async def client(session):
    """
    AsyncClient whose DB calls go to the in-memory SQLite.
    Overrides the real get_session dependency with the test session.
    """
    async def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()
