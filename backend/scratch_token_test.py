import asyncio
from httpx import AsyncClient
from app.core.security import create_access_token
from app.core.database import async_session_factory
from app.models.instructor import Instructor
from sqlmodel import select

async def run():
    async with async_session_factory() as session:
        result = await session.execute(select(Instructor))
        instructor = result.scalars().first()
        if not instructor:
            print("No instructor found!")
            return
            
        token = create_access_token(data={"sub": str(instructor.id), "role": "instructor", "email": instructor.email})
        print(f"Testing with instructor {instructor.id}...")
        
    async with AsyncClient(base_url="http://localhost:8000") as client:
        res = await client.post("/api/instructor/classes/1/assessments/submit", json={
            "name": "Midterm",
            "type": "Summative",
            "ilos": {"1": 50.0},
            "scores": {}
        }, headers={"Authorization": f"Bearer {token}"})
        print(res.status_code)
        print(res.text)

asyncio.run(run())
