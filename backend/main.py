from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import student_routes, instructor_routes, auth_routes
from app.api import instructor_auth_routes, admin_routes
from app.core.database import init_db
import app.models  # noqa: F401 — ensures all models are registered with SQLModel metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: initialising database tables...")
    await init_db()
    yield
    print("Shutdown.")


app = FastAPI(title="ASPIRE API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes (Google OAuth + local fallback)
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])

# Instructor registration (token-gated, public)
app.include_router(instructor_auth_routes.router, prefix="/instructor", tags=["Instructor Auth"])

# Admin management (protected)
app.include_router(admin_routes.router, prefix="/admin", tags=["Admin"])

# Protected domain routes
app.include_router(student_routes.router, prefix="/api/student", tags=["Student"])
app.include_router(instructor_routes.router, prefix="/api/instructor", tags=["Instructor"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "ASPIRE API is running"}
