from typing import List, Optional
from app.schemas.schemas import TaskResponse, TaskCreate, TaskStatusUpdate
from app.services import task_service
from app.routes.auth import get_current_user, require_role, get_project_filter, verify_project_access
from app.core.roles import Role
from fastapi import APIRouter, HTTPException, status, Query, Depends
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks")

@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    project_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    target_project = enforced_project_id or project_id
    tasks = await task_service.get_tasks_by_project(project_id=target_project)
    logger.info(f"✅ [TASKS] Found {len(tasks)} tasks for project_id: {target_project}")
    return tasks

@router.get("/employee/{user_id}", response_model=List[TaskResponse])
async def get_employee_tasks(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Retrieve tasks assigned to a specific employee business ID."""
    # RBAC: TEAM_LEAD can only see tasks of employees in their project
    if enforced_project_id:
        from app.services import employee_service
        emp = await employee_service.get_employee_by_employee_id(user_id) or await employee_service.get_employee_by_id(user_id)
        if emp:
            verify_project_access(current_user, emp.get("projectId"))
            
    return await task_service.get_tasks_by_employee(employee_id=user_id)

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task: TaskCreate,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN, Role.TEAM_LEAD]))
):
    """Create a new task in MongoDB."""
    from app.services import employee_service
    
    # RBAC: TEAM_LEAD can only create tasks for their project
    if current_user["role"] == Role.TEAM_LEAD:
        lead_project_id = str(current_user.get("project_id"))
        if not lead_project_id:
            raise HTTPException(status_code=403, detail="Forbidden: You are not assigned to any project.")
            
        # 1. Force the task to belong to the Lead's project
        task.projectId = lead_project_id
        
        # 2. 🔥 SECURITY CHECK: Verify the employee belongs to this project
        # Supports both ObjectId and string business IDs
        emp = await employee_service.get_employee_by_employee_id(task.assignedTo) or \
              await employee_service.get_employee_by_id(task.assignedTo)
              
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found.")
            
        emp_project_id = str(emp.get("projectId") or emp.get("project_id") or "")
        
        if emp_project_id != lead_project_id:
            logger.warning(f"🚨 UNAUTHORIZED TASK ASSIGNMENT: Team Lead {current_user.get('employee_id')} tried to assign task to employee {task.assignedTo} in project {emp_project_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Forbidden: You can only assign tasks to employees in your own project."
            )
        
    logger.info(f"📥 [ROUTE] POST /api/tasks | Data: {task.model_dump()}")
    task_data = task.model_dump()
    result = await task_service.create_task(task_data=task_data)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task in database. Please check backend logs."
        )
    return result

@router.put("/{id}/status", response_model=TaskResponse)
async def update_task_status(
    id: str, 
    status_update: TaskStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update task status in MongoDB."""
    # RBAC: Check if user has access to the project of this task
    task = await task_service.get_task_by_id(id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user["role"] != Role.SUPER_ADMIN:
        verify_project_access(current_user, task.get("projectId"))

    updated = await task_service.update_task_status(task_id=id, new_status=status_update.status)
    return updated

@router.put("/{id}/progress", response_model=TaskResponse)
async def update_task_progress(
    id: str, 
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update task progress percentage."""
    task = await task_service.get_task_by_id(id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user["role"] != Role.SUPER_ADMIN:
        verify_project_access(current_user, task.get("projectId"))

    progress = payload.get("progress", 0)
    updated = await task_service.update_task_progress(task_id=id, new_progress=float(progress))
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    id: str,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN, Role.TEAM_LEAD]))
):
    """Delete task from MongoDB."""
    task = await task_service.get_task_by_id(id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user["role"] == Role.TEAM_LEAD:
        verify_project_access(current_user, task.get("projectId"))

    success = await task_service.delete_task(task_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None
