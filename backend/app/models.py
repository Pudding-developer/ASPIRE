from sqlmodel import SQLModel, Field
from typing import Optional

# Using SQLModel, this class serves as BOTH our PostgreSQL database table
# and our Pydantic data validator for the FastAPI endpoints!
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    role: str = Field(default="student") # Either 'student' or 'instructor'
