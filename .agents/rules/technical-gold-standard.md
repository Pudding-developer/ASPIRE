---
trigger: manual
---

"Always prioritize asynchronous implementations for backend logic. All database operations must use AsyncSession from sqlmodel.ext.asyncio.session and the asyncpg driver. Avoid synchronous SQLAlchemy or standard psycopg2 patterns."