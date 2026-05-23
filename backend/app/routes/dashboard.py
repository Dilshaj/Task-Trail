from app.schemas.schemas import DashboardMetricsResponse
from app.services import dashboard_service
from app.routes.auth import get_current_user, get_project_filter
from app.core.roles import Role
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/dashboard")

class UserDashboardMetricsResponse(BaseModel):
    totalTasks: int
    completedTasks: int
    pendingTasks: int

@router.get("/admin")
async def get_admin_metrics(
    project_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Provides high-level system metrics using MongoDB aggregations."""
    target_project = enforced_project_id or project_id
    stats = await dashboard_service.get_admin_dashboard_stats(project_id=target_project)
    
    # Map to schema expected by frontend
    return {
        "activeProjects": stats["projects"],
        "activeEmployees": stats["employees"],
        "attendanceToday": stats["attendance"]["today"],
        "completedTasks": stats["tasks"]["completed"],
        "totalTasks": stats["tasks"]["total"]
    }

@router.get("/activity-chart")
async def get_activity_chart(
    project_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Provides data for the monthly activity chart with project isolation."""
    target_project = enforced_project_id or project_id
    return await dashboard_service.get_monthly_attendance_chart(project_id=target_project)

@router.get("/employee/{user_id}", response_model=UserDashboardMetricsResponse)
async def get_user_metrics(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Provides individual performance metrics for a specific user with RBAC."""
    # RBAC Check: Ensure requester can access this user's data
    if current_user["role"] == Role.EMPLOYEE:
        if current_user["id"] != user_id and current_user["employee_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access these metrics")
    elif enforced_project_id:
        from app.services import employee_service
        from app.routes.auth import verify_project_access
        emp = await employee_service.get_employee_by_employee_id(user_id) or await employee_service.get_employee_by_id(user_id)
        if emp:
            verify_project_access(current_user, emp.get("projectId"))

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
