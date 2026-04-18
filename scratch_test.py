import asyncio
import json
import httpx

async def test():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # We will just try without token to see what error it is exactly
        print("Testing POST without token:")
        res = await client.post("/api/instructor/classes/1/assessments/submit", json={
            "name": "Midterm Exam",
            "type": "Summative",
            "ilos": {1: 50.0},
            "scores": {}
        })
        print(res.status_code)
        print(res.text)

asyncio.run(test())
