from app.db.mongo import db
from app.schemas.schemas import ProjectCreate, ProjectUpdate
from app.utils.cloudinary_utils import upload_base64_image, DEFAULT_IMAGE
from bson import ObjectId
from datetime import datetime
import logging
import time

logger = logging.getLogger(__name__)

def format_project(project):
    if not project:
        return None
        
    img_url = project.get("image")
    
    # 🛡️ RELAXED GUARD: 
    # Only replace if URL is empty or contains "dzvk36pqu" (ghost account)
    # BUT allow local URLs (starting with http/https and containing /uploads/)
    
    is_broken = not img_url or img_url == "" or img_url == "undefined" or img_url == "null"
    is_ghost = "dzvk36pqu" in str(img_url).lower()
    
    must_replace = is_broken or is_ghost

    final_img = DEFAULT_IMAGE if must_replace else img_url

    # 🔄 CACHE BREAKER: Add timestamp only if it doesn't have one and is a known image URL
    if not must_replace and "?" not in str(final_img) and ("cloudinary" in str(final_img) or "uploads" in str(final_img)):
        final_img = f"{final_img}?v={int(time.time())}"

    formatted = {
        "id": str(project.get("_id")),
        "name": project.get("name"),
        "image": final_img,
        "createdAt": project.get("created_at"),
        "updatedAt": project.get("updated_at")
    }
    return formatted

async def get_projects(skip: int = 0, limit: int = 100):
    try:
        cursor = db.projects.find({}).sort("created_at", -1).skip(skip).limit(limit)
        raw_projects = await cursor.to_list(length=100)
        return [format_project(p) for p in raw_projects]
    except Exception as e:
        logger.error(f"🔥 GET PROJECTS ERROR: {str(e)}")
        return []

async def create_project(project: ProjectCreate):
    try:
        project_data = {
            "name": project.name,
            "image": project.image or DEFAULT_IMAGE,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        insert_result = await db.projects.insert_one(project_data)
        saved_project = await db.projects.find_one({"_id": insert_result.inserted_id})
        return format_project(saved_project)
    except Exception as e:
        logger.error(f"🔥 CREATE PROJECT ERROR: {str(e)}")
        raise e

async def update_project(project_id: str, project_update: ProjectUpdate):
    try:
        update_data = {"updated_at": datetime.utcnow()}
        if project_update.name:
            update_data["name"] = project_update.name
        if project_update.image:
            update_data["image"] = project_update.image
                
        result = await db.projects.find_one_and_update(
            {"_id": ObjectId(project_id)},
            {"$set": update_data},
            return_document=True
        )
        return format_project(result)
    except Exception as e:
        logger.error(f"🔥 UPDATE PROJECT ERROR: {str(e)}")
        raise e

async def delete_project(project_id: str):
    try:
        result = await db.projects.delete_one({"_id": ObjectId(project_id)})
        return result.deleted_count > 0
    except Exception:
        return False
