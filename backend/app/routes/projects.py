from fastapi import APIRouter, HTTPException, status, UploadFile, File, Request, Depends
from typing import List, Optional
import logging
from app.schemas.schemas import ProjectResponse, ProjectCreate, ProjectUpdate
from app.services import project_service
from app.utils.cloudinary_utils import upload_image as upload_to_cloudinary
from app.routes.auth import get_current_user, require_role, get_project_filter
from app.core.roles import Role

DEFAULT_IMAGE = "https://res.cloudinary.com/dv1sih7vk/image/upload/v1739343356/projects/placeholder.png"
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects")

@router.get("", response_model=List[ProjectResponse])
async def get_projects(
    skip: int = 0, 
    limit: int = 100,
    project_id: Optional[str] = Depends(get_project_filter)
):
    try:
        return await project_service.get_projects(skip=skip, limit=limit, project_id=project_id)
    except Exception as e:
        logger.error(f"GET PROJECTS ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Database fetch failed")

@router.post("/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Upload project logo directly to Cloudinary."""
    try:
        contents = await file.read()
        cloudinary_url = upload_to_cloudinary(contents, folder="projects")
        
        if cloudinary_url:
            return {"image_url": cloudinary_url}
        else:
            raise HTTPException(status_code=500, detail="Cloudinary upload failed")
            
    except Exception as e:
        logger.error(f"Project Image Upload Error: {e}")
        return {"image_url": DEFAULT_IMAGE}

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def add_project(project: ProjectCreate, current_user: dict = Depends(require_role([Role.SUPER_ADMIN]))):
    return await project_service.create_project(project=project)

@router.put("/{id}", response_model=ProjectResponse)
async def update_project(id: str, project: ProjectUpdate, current_user: dict = Depends(require_role([Role.SUPER_ADMIN]))):
    return await project_service.update_project(project_id=id, project_update=project)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(id: str, current_user: dict = Depends(require_role([Role.SUPER_ADMIN]))):
    await project_service.delete_project(project_id=id)
    return None
