import asyncio
import sys
import os

from app.core.database import async_session_factory
from app.schemas.user import LocalRegisterRequest, LocalLoginRequest
from app.services.auth_service import local_register_student, local_login_flow

async def test_auth():
    async with async_session_factory() as session:
        # Register
        req = LocalRegisterRequest(
            first_name="Test",
            last_name="User",
            sr_code="99-99999",
            email="testuser99@gmail.com",
            password="testpassword123"
        )
        print("Registering...")
        try:
            token = await local_register_student(session, req)
            print(f"Registered! Token: {token[:20]}...")
        except Exception as e:
            print(f"Register error: {e}")
            
        # Login
        login_req = LocalLoginRequest(
            email="testuser99@gmail.com",
            password="testpassword123"
        )
        print("Logging in...")
        try:
            token, path = await local_login_flow(session, login_req)
            print(f"Logged in! Token: {token[:20]}..., Redirect: {path}")
        except Exception as e:
            print(f"Login error: {e}")

if __name__ == "__main__":
    asyncio.run(test_auth())
