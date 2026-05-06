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

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        db.connect()
        logger.info("[DB] MongoDB Atlas connection established.")
        await sync_indexes()
    except Exception as e:
        logger.error(f"[STARTUP ERROR] {e}")
    yield
    db.close()
    logger.info("[SHUTDOWN] Closing connections...")

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
    err_msg = str(exc)
    logger.error(f"GLOBAL ERROR: {err_msg}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal Server Error: {err_msg}",
            "msg": err_msg,
            "path": request.url.path
        }
    )

# --- API Routes (High Priority first)
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(pay_slips.router, prefix="/api", tags=["Pay Slips"])
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(employees.router, prefix="/api", tags=["Employees"])
app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(profile.router, prefix="/api", tags=["Profile"])
app.include_router(offer_letter.router, prefix="/api", tags=["Offer Letter"])
app.include_router(employee_leaves.router, prefix="/api", tags=["Leaves"])

# --- Health
@app.get("/api/health")
async def health_check():
    db_status = "Connected" if db.db is not None else "Disconnected"
    return {
        "status": "healthy", 
        "version": "v1.1.1-debug",
        "database": db_status,
        "router_active": True
    }

# --- React SPA Frontend (MUST BE LAST)
FRONTEND_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "work-updates", "dist")

if os.path.exists(FRONTEND_PATH):
    assets_path = os.path.join(FRONTEND_PATH, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if any(full_path.startswith(p) for p in ["api", "assets"]):
             logger.warning(f"[404] Route not found: {full_path}")
             return JSONResponse(status_code=404, content={"detail": f"Route not found: {full_path}"})
        
        file_path = os.path.join(FRONTEND_PATH, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_PATH, "index.html"))
