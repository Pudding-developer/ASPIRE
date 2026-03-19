from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import student_routes, instructor_routes
from app.database import init_db
import app.models  # We must import models or SQLModel won't see them to create the tables!

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This happens when the server boots
    print("Database Startup: Creating tables...")
    await init_db()
    yield
    print("Database Shutdown.")

app = FastAPI(title="ASPIRE API", lifespan=lifespan)

# Setup CORS to allow the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(student_routes.router, prefix="/api/student", tags=["Student"])
app.include_router(instructor_routes.router, prefix="/api/instructor", tags=["Instructor"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "FastAPI backend is running"}
