import asyncio
from app.core.database import async_session_factory
from sqlmodel import select
from app.models.instructor_invite_token import InstructorInviteToken

async def debug():
    async with async_session_maker() as session:
        result = await session.execute(select(InstructorInviteToken))
        tokens = result.scalars().all()
        for t in tokens:
            print(f"ID: {t.id}")
            print(f"Token: {t.token}")
            print(f"Used: {t.is_used}")
            print(f"Expires: {t.expires_at}")
            print("---")

if __name__ == "__main__":
    asyncio.run(debug())
