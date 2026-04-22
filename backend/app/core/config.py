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

# JWT / Security
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Allowed institution email domain
ALLOWED_EMAIL_DOMAIN = os.getenv("ALLOWED_EMAIL_DOMAIN", "")

# GitHub OAuth
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/github/callback")

# Resend Email Configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "ASPIRE <onboarding@resend.dev>")

# Gemini AI — Vertex AI via Service Account JSON
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "vertex_ai/gemini-2.5-flash")
VERTEX_AI_PROJECT = os.getenv("VERTEX_AI_PROJECT", "aspire-494019")
VERTEX_AI_LOCATION = os.getenv("VERTEX_AI_LOCATION", "us-central1")

# Service account key — both LiteLLM and google-genai read GOOGLE_APPLICATION_CREDENTIALS.
_sa_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
if _sa_path:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = _sa_path
os.environ["VERTEXAI_PROJECT"] = VERTEX_AI_PROJECT
os.environ["VERTEXAI_LOCATION"] = VERTEX_AI_LOCATION

