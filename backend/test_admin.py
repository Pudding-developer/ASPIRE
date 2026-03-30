import asyncio
from httpx import AsyncClient
from sqlmodel import select
from app.core.database import get_session
from app.models.admin import Admin
from app.services.auth_service import build_jwt
from main import app
from fastapi.testclient import TestClient

async def get_test_token():
    gen = get_session()
    session = await anext(gen)
    
    # Check if we have an admin
    admin = (await session.execute(select(Admin))).scalar_one_or_none()
    if not admin:
        print("Inserting fake admin...")
        admin = Admin(email="testadmin@g.batstate-u.edu.ph", full_name="Test Admin")
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
    return build_jwt(admin, "admin")

async def run_test():
    token = await get_test_token()
    client = TestClient(app)
    
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"assigned_email": "test@g.batstate-u.edu.ph", "expires_in_hours": 48}
    
    print("Sending POST request to /admin/tokens/generate...")
    response = client.post("/admin/tokens/generate", json=payload, headers=headers)
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)

if __name__ == "__main__":
    asyncio.run(run_test())
