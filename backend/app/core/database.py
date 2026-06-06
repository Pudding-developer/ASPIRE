from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from app.core.config import DATABASE_URL

# Create the async engine so FastAPI can talk to PostgreSQL efficiently without blocking
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# Session factory
async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


# This dependency yields a database session to any endpoint that asks for it
async def get_session() -> AsyncSession:
    async with async_session_factory() as session:
        yield session


# Helper function to automatically create our tables inside the PostgreSQL database when the app starts up
# Note: In production, use Alembic migrations instead of this function
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE classes ADD COLUMN IF NOT EXISTS curriculum_id INTEGER REFERENCES curricula(id) ON DELETE SET NULL;"))
        except Exception as e:
            print("Warning: could not add curriculum_id column to classes table:", e)

