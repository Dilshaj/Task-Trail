# EduProva Management System

Task and Employee Management Platform with dynamic PDF generation and real-time attendance tracking.

## 🚀 Quick Setup

### 1. Backend (FastAPI + SQL Server)
1. Navigate to the backend folder: `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate environment:
   - Windows: `.\venv\Scripts\activate`
   - Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Configure `.env` (refer to `.env.example`)
6. Run server: `uvicorn app.main:app --host 0.0.0.0 --port 5000`

### 2. Frontend (React + Vite)
1. Navigate to the frontend folder: `cd work-updates`
2. Install dependencies: `npm install`
3. Configure `.env` (refer to `.env.example`)
4. Run dev: `npm run dev`
5. Build for prod: `npm run build`

## 🔑 Environment Variables
The following variables are **strictly required** for the system to operate:

| Variable | Description |
| :--- | :--- |
| `DB_HOST` | RDS/Database endpoint |
| `DB_PORT` | 1433 (default for SQL Server) |
| `DB_NAME` | Database name |
| `DB_USER` | SQL Username |
| `DB_PASSWORD` | SQL Password |
| `SECRET_KEY` | JWT signing key |
| `ALGORITHM` | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 |

## 🔗 Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for full AWS EC2/RDS deployment instructions including Nginx proxy setup.
