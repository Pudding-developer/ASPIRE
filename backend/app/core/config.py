import os
from dotenv import load_dotenv

# Load variables from .env securely
load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL")

# Google OAuth 2.0 (will be used later)
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# JWT / Security
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# CORS Origins
_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175")
ALLOWED_ORIGINS = [o.strip() for o in _origins.split(",") if o.strip()]

# Allowed institution email domain
ALLOWED_EMAIL_DOMAIN = os.getenv("ALLOWED_EMAIL_DOMAIN", "")

# GitHub OAuth
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/github/callback")

# Resend Email Configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "ASPIRE <onboarding@resend.dev>")

# Gemini AI — supports two auth modes:
#   1. AI Studio API key   → set GEMINI_API_KEY in .env (simpler, separate quota)
#   2. Vertex AI service account → set GOOGLE_APPLICATION_CREDENTIALS (legacy)
# If GEMINI_API_KEY is present, the codebase prefers AI Studio across LiteLLM,
# google-genai embeddings, and the chat client.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
USE_GEMINI_API_KEY = bool(GEMINI_API_KEY)

# Default model name depends on the active provider — litellm uses different prefixes.
_default_model = "gemini/gemini-2.5-flash" if USE_GEMINI_API_KEY else "vertex_ai/gemini-2.5-flash"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", _default_model)

VERTEX_AI_PROJECT = os.getenv("VERTEX_AI_PROJECT", "aspire-494019")
VERTEX_AI_LOCATION = os.getenv("VERTEX_AI_LOCATION", "asia-southeast1")
1
if USE_GEMINI_API_KEY:
    # LiteLLM and google-genai both read these.
    os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
else:
    # Vertex AI path — service account auth.
    _sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    if _sa_path:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = _sa_path
    os.environ["VERTEXAI_PROJECT"] = VERTEX_AI_PROJECT
    os.environ["VERTEXAI_LOCATION"] = VERTEX_AI_LOCATION

