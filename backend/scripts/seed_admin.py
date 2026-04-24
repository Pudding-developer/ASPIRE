"""
seed_admin.py — Create the first admin account.

Run once:
    cd backend
    source venv/bin/activate
    python scripts/seed_admin.py

The admin logs in via Google on the landing page.
The OAuth callback finds their email in the admin table and redirects to /admin/dashboard.
"""
import asyncio
import sys
import os

# Allow running from the backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select

import app.models  # noqa — register all models
from app.models.admin import Admin
from app.core.config import DATABASE_URL, ALLOWED_EMAIL_DOMAIN


async def seed():
    domain = ALLOWED_EMAIL_DOMAIN or "g.batstate-u.edu.ph"

    print("=== ASPIRE Admin Seeder ===")
    email = input(f"Admin email (@{domain}): ").strip().lower()

    if not email.endswith(f"@{domain}"):
        print(f"Error: Email must end in @{domain}")
        sys.exit(1)

    full_name = input("Admin full name: ").strip()
    if not full_name:
        print("Error: Full name is required.")
        sys.exit(1)

    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    SessionFactory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionFactory() as session:
        result = await session.execute(select(Admin).where(Admin.email == email))
        if result.scalar_one_or_none():
            print(f"Admin with email '{email}' already exists.")
            await engine.dispose()
            return

        admin = Admin(email=email, full_name=full_name)
        session.add(admin)
        await session.commit()
        print(f"\n Admin account created for {full_name} <{email}>")
        print("They can now log in via Google on the landing page.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
