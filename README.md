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
├── frontend/        # React + Vite application
└── backend/         # FastAPI application, API routes, models, migrations
```

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
uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend (React)

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
| `POST` | `/auth/register` | Register with email + password |
| `POST` | `/auth/login` | Login with SR code + password |
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
