from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from bson import ObjectId
import logging

from app.schemas.schemas import EmployeeResponse, EmployeeCreate, EmployeeProgressUpdate, EmployeeUpdate
from app.services import employee_service
from app.utils.cloudinary_utils import upload_base64_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employees")

@router.get("", response_model=List[EmployeeResponse])
async def get_employees(
    project_id: Optional[str] = Query(None),
    skip: int = 0, 
    limit: int = 100
):
    return await employee_service.get_employees(skip=skip, limit=limit, project_id=project_id)

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(employee: EmployeeCreate):
    try:
        return await employee_service.create_employee(employee)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id}", response_model=EmployeeResponse)
async def get_employee(id: str):
    employee = await employee_service.get_employee_by_id(id)
    if not employee:
         employee = await employee_service.get_employee_by_employee_id(id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.put("/{id}", response_model=EmployeeResponse)
async def update_employee(id: str, employee_update: EmployeeUpdate, request: Request):
    """Update employee using Cloudinary exclusively."""
    try:
        if employee_update.avatar and employee_update.avatar.startswith("data:image"):
            try:
                cloudinary_url = upload_base64_image(employee_update.avatar, folder="avatars")
                if cloudinary_url:
                    employee_update.avatar = cloudinary_url
                else:
                    raise HTTPException(status_code=500, detail="Cloudinary upload failed")
            except Exception as e:
                logger.error(f"Cloudinary Base64 Upload Failed: {e}")
                raise HTTPException(status_code=500, detail="Image upload failed")

        updated = await employee_service.update_employee(id, employee_update)
        if not updated:
            raise HTTPException(status_code=404, detail="Employee not found")
        return updated
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{id}/progress", response_model=EmployeeResponse)
async def update_progress(id: str, progress: EmployeeProgressUpdate):
    updated = await employee_service.update_employee_progress(id, progress)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return updated

@router.put("/{id}/assign", response_model=EmployeeResponse)
async def assign_project(id: str, payload: dict):
    project_id = payload.get("projectId") or payload.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
        
    updated = await employee_service.assign_employee_project(id, project_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(id: str):
    success = await employee_service.delete_employee(id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")
    return None
