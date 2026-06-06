# ASPIRE

ASPIRE (Academic Student Performance and Intelligence for Retention and Enrollment) is a web application built with a React (Vite) frontend and a FastAPI backend, utilizing PostgreSQL and SQLModel for database management. It provides ML-powered academic forecasting and enrollment prediction tools for educational institutions.

## Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS v4, Framer Motion
- **Backend:** FastAPI, Python 3.12, SQLModel (SQLAlchemy async)
- **Database:** PostgreSQL with Alembic migrations
- **Auth:** Local (email + bcrypt) and Google OAuth 2.0 (institution-only domain)
- **Deployment Plan:** Vercel (Frontend) & Render (Backend)

## Project Structure

```
ASPIRE/
├── backend/                   # FastAPI backend application
│   ├── app/                   # Core application package
│   │   ├── ai/                # CrewAI agents, tasks, and RAG configuration
│   │   ├── api/               # FastAPI route controllers
│   │   ├── core/              # Config, security, and database session setup
│   │   ├── models/            # SQLAlchemy / SQLModel database models
│   │   ├── repositories/      # Database abstraction/queries layer
│   │   ├── schemas/           # Pydantic schemas for request/response validation
│   │   ├── services/          # Core business logic services
│   │   └── utils/             # Helper utilities
│   ├── Documents/             # Reference spreadsheet/PDF files for curriculum
│   ├── migrations/            # Alembic database migration scripts
│   ├── ml/                    # Machine learning models, artifacts, and training scripts
│   │   ├── artifacts/         # Trained model pipeline joblib and metadata
│   │   ├── config/            # Course profiles and skills mapping configuration
│   │   └── training/          # Model retraining logic and helpers
│   ├── scripts/               # Seeding and utility scripts (e.g. seed_admin.py)
│   ├── tests/                 # Automated pytest unit/integration tests
│   └── main.py                # FastAPI entry point
│
└── frontend/                  # React + Vite frontend application
    ├── public/                # Static assets (images, videos)
    └── src/                   # React source code
        ├── assets/            # CSS, logo, and background assets
        ├── context/           # Shared state (e.g. authentication context)
        ├── features/          # Modular feature components & hooks
        │   ├── admin/         # Admin tabs (Students, Advising, Curriculum)
        │   ├── instructor/    # Instructor dashboards, advisor lists
        │   ├── landing/       # Public landing page with video preview
        │   └── student/       # Career coach chat, Git metrics, performance views
        ├── pages/             # Route page wrapper components
        ├── services/          # API services wrapper functions (Axios client)
        └── index.css          # Tailwind / global styling configuration
```

## System Architecture & Data Flow

ASPIRE is built using a decoupled client-server architecture with a local machine learning predicting pipeline and an agentic AI advising system.

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                     │
│  - React 19 UI Modules (features/admin, student, etc.) │
│  - Axios Client (services/roadmapService.js, etc.)     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST APIs
                           ▼
┌────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                    │
│  - REST Controllers (app/api/curriculum_routes.py)     │
│  - Business Layer (app/services/roadmap_service.py)    │
│  - Data Layer (app/repositories/ & app/models/)        │
└────────────┬─────────────┬─────────────┬───────────────┘
             │             │             │
             │ SQL         │ Feature     │ LLM Config
             ▼             ▼ Matrices    ▼
┌────────────┐     ┌───────────┐     ┌───────────────────┐
│ DATABASE   │     │ ML MODEL  │     │ CREWAI & GEMINI   │
│ PostgreSQL │     │ Gradient  │     │ - Career Agent    │
│  & SQLModel│     │ Boosting  │     │ - Skillset RAG    │
│            │     │ Predictor │     │ - Gemini Model    │
└────────────┘     └───────────┘     └───────────────────┘
```

### 1. Client-Side Presentation Layer (`/frontend`)
- **Vite Bundler:** Compiles modern ES6 modules and applies global styles via TailwindCSS.
- **Routing:** Governed by `react-router-dom` in `src/pages/` to redirect users based on roles (Student, Instructor, Admin).
- **State Management:** Preserves user profiles, current enrollment details, and active advising sessions via context wrappers (`src/context/`).
- **Feature Modules (`src/features/`):** Encapsulates visual views and custom hooks (e.g., student classes, career roadmaps, advising chat components) separately.

### 2. Server-Side Application Layer (`/backend/app`)
- **FastAPI Routing (`app/api/`):** Validates incoming requests using Pydantic DTOs (`app/schemas/`), checks role-based permissions via dependencies (`app/api/deps.py`), and routes to services.
- **Business Logic Services (`app/services/`):** Integrates curriculum ingestion, student profile updates, ML evaluations, and automated advising pipelines.
- **Database Abstraction (`app/repositories/`):** Encapsulates raw database actions via SQLModel/SQLAlchemy async sessions to decouple queries from the service layer.

### 3. Machine Learning Subsystem (`/backend/ml`)
- **Configuration (`ml/config/targets.py`):** Holds course profiles and course-specific sub-skill weights.
- **Model Training Pipeline (`ml/training/train.py`):** Fetches student assessment scores from PostgreSQL, aggregates Intended Learning Outcome (ILO) grades, and trains a `MultiOutputRegressor` (wrapping `GradientBoostingRegressor`) to map student performance to professional skillset scores.
- **Artifact Store (`ml/artifacts/`):** Serializes the trained pipeline into `.joblib` files along with performance evaluations (`metrics.json`).

### 4. Agentic AI Advising Subsystem (`/backend/app/ai`)
- **RAG & Knowledge Base (`app/ai/rag.py`):** Embeds and indexes curriculum career guides into SQLite/PostgreSQL vectors for semantic career-path retrieval.
- **Multi-Agent Pipeline (`app/ai/crew.py`):** Uses CrewAI to spin up role-specific agents:
  - **Academic Advisor Agent:** Analyzes the student's ML-generated skillset profile, grade statistics, and elective interests.
  - **Career Coach Agent:** Searches the curriculum knowledge base for matching career paths and aligns them with industrial skills.
- **LLM Coordinator (`app/core/config.py`):** Interfaces with LiteLLM to dispatch prompts to Gemini-2.5 models using Google AI Studio API or Google Vertex AI.

---

## LLM (Large Language Model) Configuration

The application uses Gemini models (e.g. `gemini-2.5-flash`) for AI advising, career coaching, RAG (Retrieval-Augmented Generation), and skill synthesis. It supports two authentication modes configured via the `backend/.env` file:

### Mode 1: Gemini AI Studio API Key (Recommended & Simplest)
This uses Google AI Studio's direct API endpoint. 
1. Obtain an API key from Google AI Studio.
2. Add the following to `backend/.env`:
   ```env
   GEMINI_API_KEY=your-api-key-here
   GEMINI_MODEL=gemini/gemini-2.5-flash
   ```

### Mode 2: Google Cloud Vertex AI (Service Account)
This uses Google Cloud Platform's enterprise Vertex AI endpoint.
1. Download your GCP Service Account credentials JSON file.
2. Save it inside the `backend/Documents/` folder.
3. Configure the following variables in `backend/.env`:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=Documents/your-service-account-json-file.json
   GEMINI_MODEL=vertex_ai/gemini-2.5-flash
   VERTEX_AI_PROJECT=your-gcp-project-id
   VERTEX_AI_LOCATION=your-gcp-location-zone (e.g. asia-southeast1)
   ```

---

## Local Development Setup

### 1. Database Setup

Ensure PostgreSQL is installed and running. Open your `psql` console:

```sql
CREATE DATABASE aspire_db;
CREATE USER aspire_user WITH ENCRYPTED PASSWORD 'aspire123';
GRANT ALL PRIVILEGES ON DATABASE aspire_db TO aspire_user;
ALTER DATABASE aspire_db OWNER TO aspire_user;
```

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:

```env
DATABASE_URL=postgresql+asyncpg://aspire_user:aspire123@localhost/aspire_db
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
ALLOWED_EMAIL_DOMAIN=g.batstate-u.edu.ph
```

Run database migrations:

```bash
alembic upgrade head
```

Start the backend server:

```bash
# Make sure your virtual environment is activated:
source venv/bin/activate
uvicorn main:app --reload

# Or run directly using the virtual environment's path:
venv/bin/uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 3. Initial Admin Setup

To log in as an administrator, you must first create an initial admin account:

```bash
# In the backend directory with venv activated
python scripts/seed_admin.py
```

The terminal will prompt you for the admin email (must be within the allowed domain, e.g., `@g.batstate-u.edu.ph`) and full name. Once completed, you can use Google OAuth on the landing page to log in as the admin.

### 4. Running the Tests

To run the structured unit and integration test suite:

```bash
cd backend
# Run with PYTHONPATH pointing to the current directory:
PYTHONPATH=. venv/bin/pytest
```

### 5. Retraining the ML Model

To retrain the academic forecasting and skill-prediction model:

```bash
cd backend
# Run the training script with PYTHONPATH set:
PYTHONPATH=. venv/bin/python -m ml.training.train
```

### 6. Frontend (React)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Auth Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/login/google` | Initiate Google OAuth |
| `GET` | `/auth/callback` | Google OAuth callback |

## Frontend Dependencies

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI library |
| `react-router-dom` | Client-side routing |
| `lucide-react` | Icons |
| `motion` | Animations |
| `tailwindcss` | Utility-first CSS |
| `vite` | Build tool / dev server |

## Git Workflow

**Remote:** `https://github.com/Pudding-developer/ASPIRE.git`

### Branches

| Branch | Purpose |
|---|---|
| `main` | Production / stable branch |
| `landingpage-and-instructor-dashboard` | Current dev branch |
| `ML-MODEL` | Machine learning model branch |

### Common Commands

```bash
# Push current branch (first time)
git push --set-upstream origin your-branch-name

# Stage, commit, and push
git add .
git commit -m "feat: your message here"
git push origin

# Create and switch to a new branch
git checkout -b your-branch-name

# Merge into main
git checkout main
git merge your-branch-name
git push origin main
```

---

*Configured for zero-downtime deployment to Vercel and Render.*
