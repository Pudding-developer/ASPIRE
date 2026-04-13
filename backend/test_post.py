import asyncio
from httpx import AsyncClient
from app.core.security import create_access_token

async def test():
    token = create_access_token({"sub": "1", "role": "student"})
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.post("/pipeline/run/1", headers=headers)
        print(response.status_code)
        print(response.json())

if __name__ == "__main__":
    asyncio.run(test())
