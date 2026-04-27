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

@router.get("/", response_model=List[ProjectResponse])
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
        # 1. Ensure local directory exists
        upload_dir = os.path.join("uploads", "projects")
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 2. Save locally
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"proj_{int(datetime.now().timestamp())}{file_extension}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 3. Generate Local URL
        base_url = str(request.base_url).rstrip("/")
        final_url = f"{base_url}/uploads/projects/{filename}"
        print(f"✅ LOGO LOCAL SAVED: {final_url}")

        # 4. Attempt Cloudinary Sync as secondary
        try:
             # Reset file pointer for Cloudinary
            with open(file_path, "rb") as f_in:
                cloudinary.config(cloud_name="dv1sih7vk")
                cloudinary_url = upload_to_cloudinary(f_in, folder="projects")
                
                # Only use Cloudinary URL if it's from the correct account
                if cloudinary_url and "dv1sih7vk" in cloudinary_url:
                    final_url = cloudinary_url
                    print(f"☁️ LOGO CLOUDINARY SYNC: {final_url}")
        except Exception as ce:
            logger.warning(f"⚠️ Cloudinary Logo Sync Failed (using local): {ce}")
            
        return {"image_url": final_url}
        
    except Exception as e:
        logger.error(f"🔥 Image Upload Route Error: {e}")
        return {"image_url": DEFAULT_IMAGE}

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def add_project(project: ProjectCreate):
    return await project_service.create_project(project=project)

@router.put("/{id}", response_model=ProjectResponse)
async def update_project(id: str, project: ProjectUpdate):
    return await project_service.update_project(project_id=id, project_update=project)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(id: str):
    await project_service.delete_project(project_id=id)
    return None
