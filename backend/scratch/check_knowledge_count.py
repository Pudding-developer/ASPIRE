
import asyncio
from sqlmodel import select, func
from app.core.database import async_session_factory
from app.models.knowledge import KnowledgeChunk

async def check_count():
    async with async_session_factory() as session:
        statement = select(func.count()).select_from(KnowledgeChunk)
        result = await session.execute(statement)
        count = result.scalar()
        print(f"Total KnowledgeChunks: {count}")

if __name__ == "__main__":
    asyncio.run(check_count())
