from fastapi import APIRouter, HTTPException, status, Query, Request, Depends
from typing import List, Optional
from bson import ObjectId
import logging

from app.schemas.schemas import EmployeeResponse, EmployeeCreate, EmployeeProgressUpdate, EmployeeUpdate
from app.services import employee_service
from app.utils.cloudinary_utils import upload_base64_image
from app.routes.auth import get_current_user, require_role, get_project_filter, verify_project_access
from app.core.roles import Role
from app.db.mongo import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employees")

@router.get("", response_model=List[EmployeeResponse])
async def get_employees(
    project_id: Optional[str] = Query(None),
    skip: int = 0, 
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """
    SUPER_ADMIN: Sees everyone (can filter by project_id)
    TEAM_LEAD: Sees only their project's employees
    """
    target_project = enforced_project_id or project_id
    return await employee_service.get_employees(skip=skip, limit=limit, project_id=target_project)

@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee: EmployeeCreate,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN, Role.TEAM_LEAD]))
):
    """
    TEAM_LEAD can only create employees for their own project.
    """
    if current_user["role"] == Role.TEAM_LEAD:
        if not employee.project_id or employee.project_id != current_user.get("project_id"):
             employee.project_id = current_user.get("project_id")
             
    try:
        created = await employee_service.create_employee(employee)
        if created is None:
            raise HTTPException(status_code=400, detail="Failed to create employee. Employee ID may already exist.")
        return created
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/search", response_model=Optional[EmployeeResponse])
async def search_employees(
    employee_id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    employee = await employee_service.search_employee(employee_id, name)
    if employee and enforced_project_id:
        verify_project_access(current_user, employee.get("projectId"))
    return employee

@router.get("/{id}", response_model=EmployeeResponse)
async def get_employee(
    id: str,
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    employee = await employee_service.get_employee_by_id(id)
    if not employee:
         employee = await employee_service.get_employee_by_employee_id(id)
         
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if enforced_project_id:
        verify_project_access(current_user, employee.get("projectId"))
        
    return employee

@router.put("/{id}", response_model=EmployeeResponse)
async def update_employee(
    id: str, 
    employee_update: EmployeeUpdate, 
    request: Request,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN, Role.TEAM_LEAD]))
):
    """Update employee using Cloudinary exclusively."""
    # RBAC: TEAM_LEAD can only update their own project's employees
    existing = await employee_service.get_employee_by_id(id) or await employee_service.get_employee_by_employee_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if current_user["role"] == Role.TEAM_LEAD:
        verify_project_access(current_user, existing.get("projectId"))
        # TEAM_LEAD cannot change the project_id or role to SUPER_ADMIN
        employee_update.project_id = existing.get("projectId")
        if employee_update.role == Role.SUPER_ADMIN:
            employee_update.role = Role.TEAM_LEAD

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
async def update_progress(
    id: str, 
    progress: EmployeeProgressUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Progress update can be done by self or TL/Admin
    if current_user["role"] == Role.EMPLOYEE:
        if current_user["id"] != id and current_user["employee_id"] != id:
            raise HTTPException(status_code=403, detail="Not authorized to update other's progress")
    else:
        # TL check
        if current_user["role"] == Role.TEAM_LEAD:
             existing = await employee_service.get_employee_by_id(id) or await employee_service.get_employee_by_employee_id(id)
             verify_project_access(current_user, existing.get("projectId"))

    updated = await employee_service.update_employee_progress(id, progress)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return updated

@router.put("/{id}/assign", response_model=EmployeeResponse)
async def assign_project(
    id: str, 
    payload: dict,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN]))
):
    # Only Super Admin can assign projects
    project_id = payload.get("projectId") or payload.get("project_id")
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
        
    updated = await employee_service.assign_employee_project(id, project_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return updated

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    id: str,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN]))
):
    success = await employee_service.delete_employee(id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")
    return None

@router.delete("/admin/delete-employee/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee_admin(
    id: str,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN]))
):
    """Alias for delete_employee to support specific frontend dashboard path."""
    success = await employee_service.delete_employee(id)
    if not success:
        raise HTTPException(status_code=404, detail="Employee not found")
    return None
