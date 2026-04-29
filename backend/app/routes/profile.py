import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from typing import Optional
from bson import ObjectId
from datetime import datetime
import shutil
import os

from app.db.mongo import db
from app.schemas.schemas import UserResponse
from app.routes.auth import get_current_user
from app.utils.cloudinary_utils import upload_image as upload_to_cloudinary

from pymongo import ReturnDocument

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employee")

@router.get("/test-health")
async def profile_health():
    return {"status": "ok", "message": "Profile router is reachable"}

@router.get("/profile/{user_id}", response_model=UserResponse)
async def get_profile(user_id: str):
    """Retrieve profile from MongoDB using internal ObjectId."""
    try:
        user = await db.employees.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Ensure the user object has an 'id' field for the response model
        user["id"] = str(user["_id"])
        return user
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid user ID format")

@router.put("/update-profile")
@router.put("/employee/update-profile")
async def update_profile(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    joining_date: str = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Update profile with Cloudinary storage."""
    print(f"🚀 [DEBUG] Update Profile triggered for: {name} ({email})")
    print(f"📦 [DEBUG] Profile Image: {profile_image.filename if profile_image else 'None'}")
    
    try:
        user_id = current_user.get("id")
        
        update_data = {
            "name": name,
            "email": email
        }
        
        if joining_date:
            try:
                join_date_obj = datetime.strptime(joining_date, '%Y-%m-%d')
                if join_date_obj > datetime.now():
                    raise HTTPException(status_code=400, detail="Joining date cannot be in the future.")
                update_data["joining_date"] = joining_date
            except ValueError:
                pass

        # Handle image upload
        if profile_image and profile_image.filename:
            # 1. Read bytes directly (Robust way for FastAPI UploadFile)
            contents = await profile_image.read()
            cloudinary_url = upload_to_cloudinary(contents, folder="avatars")
            
            if cloudinary_url:
                update_data["avatar"] = cloudinary_url
                print(f"☁️ [PROFILE UPDATE] Cloudinary Success: {cloudinary_url}")
            else:
                raise HTTPException(status_code=500, detail="Failed to retrieve URL from Cloudinary")

        print(f"📝 [DEBUG] Final Update Data: {update_data}")
        # Atomic Update in MongoDB
        result = await db.employees.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER
        )
        
        if not result:
            print(f"❌ [DEBUG] User NOT found in DB for ID: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"✅ [DEBUG] DB Update Success. New Avatar: {result.get('avatar')}")
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": str(result["_id"]),
                "employeeId": result.get("employee_id"),
                "name": result.get("name"),
                "email": result.get("email"),
                "role": result.get("role"),
                "avatar": result.get("avatar"),
                "projectId": result.get("project_id"),
                "joiningDate": result.get("joining_date"),
            }
        }
    except Exception as e:
        import traceback
        logger.error(f"🔥 GLOBAL PROFILE UPDATE ERROR: {str(e)}")
        logger.error(traceback.format_exc())
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
