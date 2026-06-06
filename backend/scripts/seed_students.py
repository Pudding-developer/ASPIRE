import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import select

import app.models
from app.models.user import User
from app.core.config import DATABASE_URL
from app.core.security import get_password_hash

students = [
    ("NIEL ANDREI", "AFRICA", "22-01001", "andrei@gmail.com", "andrei"),
    ("DON MAXWELL", "BELTRAN", "22-01002", "maxwell@gmail.com", "maxwell"),
    ("ALDOUZ JOAQUIN", "PERONA", "22-01003", "aldouz@gmail.com", "aldouz"),
    ("ANGEL RHOSE", "LOPEZ", "22-01004", "angel@gmail.com", "angel"),
    ("AIDAN JAYCOB", "DE CLARO", "22-01005", "aidan@gmail.com", "aidan"),
    ("JEWEL IRISH", "ARAGO", "22-01006", "jewel@gmail.com", "jewel"),
    ("PHOEBE MARGARET", "COMETA", "22-01007", "phoebe@gmail.com", "phoebe"),
    ("IVAN", "TAN", "22-01008", "ivan@gmail.com", "ivan"),
    ("DRANREB PATRICK", "SECRETO", "22-01009", "patrick@wemissyou.com", "patrick"),
    ("EUREKA NEESHA", "LAPUEBLA", "22-01010", "eureka@gmail.com", "eureka"),
    ("JEREMI", "REYES", "22-01011", "jeremi@gmail.com", "jeremi"),
    ("RILEY MIGUELA", "DELA CRUZ", "22-01012", "riley@gmail.com", "riley"),
    ("DENVER JOHN", "MANALO", "22-01013", "denver@gmail.com", "denver"),
    ("MARIA SOLITAIRE", "BUCO", "22-01014", "solitaire@gmail.com", "solitaire"),
    ("JOHN LLOYD", "PADRILAN", "22-01015", "jolo@gmail.com", "jolo"),
    ("SHYRA AVRIL", "GATILOGO", "22-01016", "shy@gmail.com", "shy"),
    ("EDCEL", "ILAGAN", "22-01017", "edcel@gmail.com", "edcel"),
    ("LOURIZE ALTHEA", "ABELLO", "22-01018", "lourize@gmail.com", "lourize"),
    ("VICTOR", "WEMBANYAMA", "22-01019", "victor@gmail.com", "victor"),
    ("STEPHON", "CASTLE", "22-01020", "stephon@gmail.com", "stephon")
]

async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    SessionFactory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionFactory() as session:
        for first, last, sr_code, email, password in students:
            result = await session.execute(select(User).where(User.sr_code == sr_code))
            if result.scalar_one_or_none():
                print(f"User {sr_code} already exists.")
                continue
            
            user = User(
                sr_code=sr_code,
                email=email,
                full_name=f"{first} {last}",
                role="student",
                hashed_password=get_password_hash(password),
                auth_provider="local"
            )
            session.add(user)
        
        await session.commit()
        print("All students have been seeded.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
