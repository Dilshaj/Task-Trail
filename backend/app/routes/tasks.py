from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from app.schemas.schemas import TaskResponse, TaskCreate, TaskStatusUpdate
from app.services import task_service

router = APIRouter(prefix="/tasks")

@router.get("", response_model=List[TaskResponse])
async def get_all_tasks(project_id: Optional[str] = Query(None)):
    """Retrieve all tasks from MongoDB."""
    return await task_service.get_tasks_by_project(project_id=project_id)

@router.get("/employee/{user_id}", response_model=List[TaskResponse])
async def get_employee_tasks(user_id: str):
    """Retrieve tasks assigned to a specific employee business ID."""
    return await task_service.get_tasks_by_employee(employee_id=user_id)

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(task: TaskCreate):
    """Create a new task in MongoDB."""
    task_data = task.model_dump()
    # Map from frontend CamelCase if necessary, or let service handle it
    # Pydantic validation_alias takes care of most mappings
    return await task_service.create_task(task_data=task_data)

@router.put("/{id}/status", response_model=TaskResponse)
async def update_task_status(id: str, status_update: TaskStatusUpdate):
    """Update task status in MongoDB."""
    updated = await task_service.update_task_status(task_id=id, new_status=status_update.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated

@router.put("/{id}/progress", response_model=TaskResponse)
async def update_task_progress(id: str, payload: dict):
    """Update task progress percentage."""
    progress = payload.get("progress", 0)
    updated = await task_service.update_task_progress(task_id=id, new_progress=float(progress))
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(id: str):
    """Delete task from MongoDB."""
    success = await task_service.delete_task(task_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return None
