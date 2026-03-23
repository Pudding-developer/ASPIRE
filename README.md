# ASPIRE

ASPIRE is a modern web application built with a React (Vite) frontend and a robust FastAPI backend, utilizing PostgreSQL and SQLModel for the database.

## 🚀 Tech Stack

- **Frontend:** React, Vite
- **Backend:** FastAPI, Python 3
- **Database:** PostgreSQL, SQLModel (SQLAlchemy)
- **Deployment Plan:** Vercel (Frontend) & Render (Backend)

## 📦 Project Structure

This is a monorepo containing both the frontend and backend applications:
- `/frontend` - Contains the React user interface.
- `/backend` - Contains the FastAPI application, API routes, and database models.

## 🛠️ Local Development Setup

### 1. Database Setup
Ensure PostgreSQL is installed and running locally. Open your `psql` console and set up the database:
```sql
CREATE DATABASE aspire_db;
CREATE USER aspire_user WITH ENCRYPTED PASSWORD 'aspire123';
GRANT ALL PRIVILEGES ON DATABASE aspire_db TO aspire_user;
ALTER DATABASE aspire_db OWNER TO aspire_user;
```

### 2. Backend (FastAPI)
Navigate to the backend directory, activate your virtual environment, and install dependencies:
```bash
cd backend
source venv/bin/activate
pip install sqlmodel asyncpg psycopg2-binary python-dotenv fastapi uvicorn
```
Create a `.env` file in the `/backend` directory:
```env
DATABASE_URL=postgresql+asyncpg://aspire_user:aspire123@localhost/aspire_db
```
Start the backend server:
```bash
uvicorn main:app --reload
```
The backend will automatically create the required database tables on startup. The API runs on `http://localhost:8000`.

### 3. Frontend (React)
Open a totally separate terminal tab, navigate to the frontend directory, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The visual frontend dashboard runs on `http://localhost:5173`.

## 📦 Frontend Dependencies

### Production
| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.4 | UI library |
| `react-dom` | ^19.2.4 | React DOM renderer |
| `react-router-dom` | ^7.13.1 | Client-side routing |
| `lucide-react` | ^0.577.0 | Icon library |
| `motion` | ^12.38.0 | Animations (Framer Motion) |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | ^4.2.2 | Utility-first CSS framework |
| `@tailwindcss/postcss` | ^4.2.2 | TW v4 PostCSS plugin |
| `postcss` | ^8.5.8 | CSS post-processing |
| `autoprefixer` | ^10.4.27 | CSS vendor prefixes |
| `vite` | ^8.0.0 | Build tool / dev server |
| `@vitejs/plugin-react` | ^6.0.0 | React plugin for Vite |
| `eslint` | ^9.39.4 | Linting |
| `eslint-plugin-react-hooks` | ^7.0.1 | React Hooks lint rules |
| `eslint-plugin-react-refresh` | ^0.5.2 | React Refresh lint rules |

---

## 🔀 Git Workflow

**Remote:** `https://github.com/Pudding-developer/ASPIRE.git`

### Branches
| Branch | Purpose |
|---|---|
| `main` | Production / stable branch |
| `v2-with-frontend` | Frontend development branch |
| `ML-MODEL` | Machine learning model branch |

### Pulling Changes
```bash
# Pull the latest from the current branch
git pull origin main

# Pull from a specific branch
git pull origin v2-with-frontend

# Switch to a branch and pull
git checkout v2-with-frontend
git pull
```

### Pushing Changes
```bash
# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "feat: your commit message here"

# Push to the current branch
git push origin main

# Push to a specific branch
git push origin v2-with-frontend
```

### Creating & Switching Branches
```bash
# Create a new branch and switch to it
git checkout -b your-branch-name

# Switch to an existing branch
git checkout main

# List all branches (local + remote)
git branch -a

# Delete a local branch
git branch -d your-branch-name
```

### Merging Branches
```bash
# Merge another branch into your current branch
git checkout main
git merge v2-with-frontend

# Push after merging
git push origin main
```

---
*This repository is configured for easy zero-downtime deployment to Vercel and Render.*
