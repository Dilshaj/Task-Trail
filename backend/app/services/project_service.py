from app.db.mongo import db
from app.schemas.schemas import ProjectCreate, ProjectUpdate
from app.utils.cloudinary_utils import upload_base64_image
from bson import ObjectId
from datetime import datetime
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def format_project(project):
    if not project:
        return None
        
    img_url = project.get("image")
    
    # 🛡️ CLOUDINARY-ONLY GUARD
    is_broken = not img_url or img_url == "" or img_url == "undefined" or img_url == "null" or "/uploads/" in str(img_url)
    is_ghost = "dzvk36pqu" in str(img_url).lower()
    
    if is_broken or is_ghost:
        name = project.get("name", "Project")
        final_img = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=0D8ABC&color=fff&bold=true"
    else:
        final_img = img_url

    formatted = {
        "id": str(project.get("_id")),
        "name": project.get("name"),
        "image": final_img,
        "createdAt": project.get("created_at"),
        "updatedAt": project.get("updated_at")
    }
    return formatted

async def get_projects(skip: int = 0, limit: int = 100, project_id: Optional[str] = None):
    if db.db is None:
        return []
    try:
        query = {}
        if project_id:
            try:
                query["_id"] = ObjectId(project_id)
            except Exception:
                # If project_id is invalid ObjectId, just return empty list
                return []
                
        cursor = db.projects.find(query).sort("created_at", -1).skip(skip).limit(limit)
        raw_projects = await cursor.to_list(length=100)
        return [format_project(p) for p in raw_projects]
    except Exception as e:
        logger.error(f"🔥 GET PROJECTS ERROR: {str(e)}")
        return []

async def create_project(project: ProjectCreate):
    if db.db is None:
        return None
    try:
        project_data = {
            "name": project.name,
            "image": project.image or None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        insert_result = await db.projects.insert_one(project_data)
        saved_project = await db.projects.find_one({"_id": insert_result.inserted_id})
        return format_project(saved_project)
    except Exception as e:
        logger.error(f"🔥 CREATE PROJECT ERROR: {str(e)}")
        return None

async def update_project(project_id: str, project_update: ProjectUpdate):
    if db.db is None:
        return None
    try:
        update_data = {"updated_at": datetime.utcnow()}
        if project_update.name:
            update_data["name"] = project_update.name
        if project_update.image:
            update_data["image"] = project_update.image
                
        from pymongo import ReturnDocument
        result = await db.projects.find_one_and_update(
            {"_id": ObjectId(project_id)},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER
        )
        return format_project(result)
    except Exception as e:
        logger.error(f"🔥 UPDATE PROJECT ERROR: {str(e)}")
        return None

async def delete_project(project_id: str):
    if db.db is None:
        return False
    try:
        result = await db.projects.delete_one({"_id": ObjectId(project_id)})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting project: {e}")
        return False
