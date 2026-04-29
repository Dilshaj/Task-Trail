from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
import shutil
import os
from datetime import datetime
from bson import ObjectId

from app.schemas.schemas import EmployeeResponse, EmployeeCreate, EmployeeProgressUpdate, EmployeeUpdate
from app.services import employee_service
from app.utils.cloudinary_utils import upload_base64_image, upload_image as upload_to_cloudinary
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employees")

@router.get("", response_model=List[EmployeeResponse])
async def get_employees(
    project_id: Optional[str] = Query(None), # 🛡️ SECURED: Optional project filtering
    skip: int = 0, 
    limit: int = 100
):
    """Retrieve employees, supporting both project-specific and company-wide views."""
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
    """Update employee, converting base64 to local/Cloudinary storage."""
    try:
        if employee_update.avatar and employee_update.avatar.startswith("data:image"):
            # If it's base64, we'll save it locally first to fulfill the 'uploads folder' requirement
            try:
                # 1. Create local directory (absolute path)
                BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/
                upload_dir = os.path.join(BASE_DIR, "uploads", "avatars")
                os.makedirs(upload_dir, exist_ok=True)
                
                # 2. Extract base64
                import base64
                header, encoded = employee_update.avatar.split(",", 1)
                file_extension = ".png" # Default or extract from header
                if "image/jpeg" in header: file_extension = ".jpg"
                elif "image/webp" in header: file_extension = ".webp"
                
                filename = f"{id}_{int(datetime.now().timestamp())}{file_extension}"
                file_path = os.path.join(upload_dir, filename)
                
                with open(file_path, "wb") as f:
                    f.write(base64.b64decode(encoded))
                
                # 3. Generate Local URL (Relative for Nginx compatibility)
                local_url = f"/uploads/avatars/{filename}"
                employee_update.avatar = local_url
                
                # 4. Sync to Cloudinary
                try:
                    with open(file_path, "rb") as f_in:
                        cloudinary_url = upload_to_cloudinary(f_in, folder="employees")
                        if cloudinary_url:
                            employee_update.avatar = cloudinary_url
                except Exception as ce:
                    logger.warning(f"Cloudinary sync failed: {ce}")

            except Exception as e:
                logger.error(f"Base64 processing failed: {e}")

        updated = await employee_service.update_employee(id, employee_update)
        if not updated:
            raise HTTPException(status_code=404, detail="Employee not found")
        return updated
    except Exception as e:
        logger.error(f"🔥 EMPLOYEE UPDATE ERROR: {str(e)}")
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
