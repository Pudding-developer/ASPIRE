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

---
*This repository is configured for easy zero-downtime deployment to Vercel and Render.*
