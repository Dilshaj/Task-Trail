from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.schemas.schemas import DashboardMetricsResponse
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard")

class UserDashboardMetricsResponse(BaseModel):
    totalTasks: int
    completedTasks: int
    pendingTasks: int

@router.get("/admin")
async def get_admin_metrics(project_id: Optional[str] = Query(None)):
    """Provides high-level system metrics using MongoDB aggregations."""
    stats = await dashboard_service.get_admin_dashboard_stats(project_id=project_id)
    
    # Map to schema expected by frontend
    return {
        "activeProjects": stats["projects"],
        "activeEmployees": stats["employees"],
        "attendanceToday": stats["attendance"]["today"],
        "completedTasks": stats["tasks"]["completed"],
        "totalTasks": stats["tasks"]["total"]
    }

@router.get("/employee/{user_id}", response_model=UserDashboardMetricsResponse)
async def get_user_metrics(user_id: str):
    """Provides individual performance metrics for a specific user."""
    from app.services import task_service
    tasks = await task_service.get_tasks_by_employee(employee_id=user_id)
    
    total = len(tasks)
    completed = len([t for t in tasks if t.get("status") == "Completed"])
    pending = len([t for t in tasks if t.get("status") == "Pending"])
    
    return {
        "totalTasks": total,
        "completedTasks": completed,
        "pendingTasks": pending
    }
