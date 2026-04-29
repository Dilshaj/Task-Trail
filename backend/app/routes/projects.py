from fastapi import APIRouter, HTTPException, status, UploadFile, File, Request
from typing import List
import os
import shutil
from datetime import datetime
from app.schemas.schemas import ProjectResponse, ProjectCreate, ProjectUpdate
from app.services import project_service
from app.utils.cloudinary_utils import upload_image as upload_to_cloudinary, DEFAULT_IMAGE
import cloudinary
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects")

# 🔒 RE-FORCE COMPANY CREDENTIALS
cloudinary.config(
    cloud_name="dv1sih7vk",
    api_key="639177816396555",
    api_secret="3oKYOpuJTUAIU0aZO58Bpa1luc"
)

@router.get("", response_model=List[ProjectResponse])
async def get_projects(skip: int = 0, limit: int = 100):
    try:
        return await project_service.get_projects(skip=skip, limit=limit)
    except Exception as e:
        logger.error(f"🔥 GET PROJECTS ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Database fetch failed")

@router.post("/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Upload project logo with local storage priority and Cloudinary sync."""
    try:
        # 1. Read bytes (Robust Way)
        contents = await file.read()
        cloudinary_url = upload_to_cloudinary(contents, folder="projects")
        
        if cloudinary_url:
            print(f"☁️ [PROJECT LOGO] Cloudinary Success: {cloudinary_url}")
            return {"image_url": cloudinary_url}
        else:
            raise HTTPException(status_code=500, detail="Failed to get URL from Cloudinary")
            
    except Exception as e:
        logger.error(f"🔥 Project Image Upload Error: {e}")
        return {"image_url": DEFAULT_IMAGE}
        
    except Exception as e:
        logger.error(f"🔥 Image Upload Route Error: {e}")
        return {"image_url": DEFAULT_IMAGE}

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def add_project(project: ProjectCreate):
    return await project_service.create_project(project=project)

@router.put("/{id}", response_model=ProjectResponse)
async def update_project(id: str, project: ProjectUpdate):
    return await project_service.update_project(project_id=id, project_update=project)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(id: str):
    await project_service.delete_project(project_id=id)
    return None
