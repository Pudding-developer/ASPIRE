from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import student_routes, instructor_routes, auth_routes, curriculum_routes
from app.api import instructor_auth_routes, admin_routes, github_routes
from app.api import instructor_class_routes
from app.api.pipeline_routes import router as pipeline_router
from app.api.chat_routes import router as chat_router
from app.api.roadmap_routes import router as roadmap_router
from app.core.database import init_db
import app.models  # noqa: F401
from app.core.config import ALLOWED_ORIGINS
from app.core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: initialising database tables...")
    await init_db()
    
    # Seed default curriculum if empty
    from app.models.curriculum import Curriculum, CurriculumSubject
    from app.core.database import async_session_factory
    from sqlmodel import select
    import json
    import os

    async with async_session_factory() as session:
        curriculum_result = await session.execute(select(Curriculum))
        if not curriculum_result.first():
            print("Seeding default curriculum...")
            default_curriculum = Curriculum(name="BSCpE Curriculum (Default)")
            session.add(default_curriculum)
            await session.commit()
            await session.refresh(default_curriculum)

            json_path = os.path.join(os.path.dirname(__file__), "app", "data", "curriculum.json")
            if os.path.exists(json_path):
                with open(json_path, "r") as f:
                    data = json.load(f)
                    for item in data:
                        session.add(CurriculumSubject(
                            curriculum_id=default_curriculum.id,
                            year=str(item["year"]),
                            semester=str(item["semester"]),
                            code=item["code"],
                            title=item["title"]
                        ))
                await session.commit()
                print(f"Successfully seeded {len(data)} curriculum subjects for default curriculum.")
            else:
                print(f"Could not find default curriculum file at {json_path}")
    yield
    print("Shutdown.")


app = FastAPI(title="ASPIRE API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Refresh-Token"],
)

# Auth routes (Google OAuth + local fallback)
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])

# Instructor registration (token-gated, public)
app.include_router(instructor_auth_routes.router, prefix="/instructor", tags=["Instructor Auth"])

# Admin management (protected)
app.include_router(admin_routes.router, prefix="/admin", tags=["Admin"])

# Curriculum public API
app.include_router(curriculum_routes.router, prefix="/api/curriculum", tags=["Curriculum"])

# Protected domain routes
app.include_router(student_routes.router, prefix="/api/student", tags=["Student"])
app.include_router(instructor_routes.router, prefix="/api/instructor", tags=["Instructor"])

# GitHub integration
app.include_router(github_routes.router, prefix="/api/github", tags=["GitHub"])

# Instructor class management (routes have full paths baked in)
app.include_router(instructor_class_routes.router, tags=["Instructor Classes"])

# AI career-mapping pipeline
app.include_router(pipeline_router, prefix="/api")

# AI career-coach chatbot
app.include_router(chat_router, prefix="/api")

# Career roadmap overlays
app.include_router(roadmap_router, prefix="/api")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": getattr(exc, "code", "ERROR"),
        },
        headers=exc.headers,
    )


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "ASPIRE API is running"}
