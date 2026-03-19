import os
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load variables from .env securely
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create the async engine so FastAPI can talk to PostgreSQL efficiently without blocking
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

# This dependency yields a database session to any endpoint that asks for it
async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

# Helper function to automatically create our tables inside the PostgreSQL database when the app starts up
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
