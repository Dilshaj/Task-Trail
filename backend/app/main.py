import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import settings
from app.routes import auth, employees, projects, tasks, attendance, dashboard, profile, offer_letter, employee_leaves, pay_slips
from app.db.mongo import db
from app.db.optimize import sync_indexes

# 🔹 Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        db.connect()
        logger.info("✅ MongoDB Atlas connection established.")
        await sync_indexes()
    except Exception as e:
        logger.error(f"❌ STARTUP ERROR: {e}")
    yield
    db.close()
    logger.info("💤 Shutting down...")

app = FastAPI(
    title="EduProva API",
    description="Backend for EduProva Management System",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    logger.error(f"GLOBAL ERROR: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "msg": str(exc)}
    )

# 🔹 Static & Uploads (absolute paths so server works from any CWD)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
STATIC_DIR = os.path.join(BASE_DIR, "static")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

for folder in [STATIC_DIR, UPLOADS_DIR]:
    os.makedirs(folder, exist_ok=True)

# Ensure uploads subdirectories exist
os.makedirs(os.path.join(UPLOADS_DIR, "avatars"), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, "projects"), exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# 🔹 API Routes (High Priority first)
app.include_router(pay_slips.router, prefix="/api", tags=["Pay Slips"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(employees.router, prefix="/api", tags=["Employees"])
app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(attendance.router, prefix="/api", tags=["Attendance"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(profile.router, prefix="/api", tags=["Profile"])
app.include_router(offer_letter.router, prefix="/api", tags=["Offer Letter"])
app.include_router(employee_leaves.router, prefix="/api", tags=["Leaves"])

# 🔹 Health
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "v1.1.0-final-fix"}

# 🔹 React SPA Frontend (MUST BE LAST)
FRONTEND_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "work-updates", "dist")

if os.path.exists(FRONTEND_PATH):
    assets_path = os.path.join(FRONTEND_PATH, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if any(full_path.startswith(p) for p in ["api", "static", "uploads", "assets"]):
             return JSONResponse(status_code=404, content={"detail": f"Route not found: {full_path}"})
        
        file_path = os.path.join(FRONTEND_PATH, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_PATH, "index.html"))
