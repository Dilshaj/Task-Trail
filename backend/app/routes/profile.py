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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employee")

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
    """Update profile with local storage support and Cloudinary fallback."""
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
        try:
            # 1. Create local directory
            upload_dir = os.path.join("uploads", "avatars")
            if not os.path.exists(upload_dir):
                os.makedirs(upload_dir)
            
            # 2. Save locally
            file_extension = os.path.splitext(profile_image.filename)[1]
            filename = f"{user_id}_{int(datetime.now().timestamp())}{file_extension}"
            file_path = os.path.join(upload_dir, filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(profile_image.file, buffer)
            
            # 3. Generate full URL
            # We use the current request to get the base URL (e.g., http://localhost:5000)
            base_url = str(request.base_url).rstrip("/")
            local_url = f"{base_url}/uploads/avatars/{filename}"
            
            update_data["avatar"] = local_url
            print(f"📸 [PROFILE UPDATE] Local Image Saved: {local_url}")
            
            # 4. Try Cloudinary as backup/primary if configured
            try:
                # Open file in binary mode for cloudinary
                with open(file_path, "rb") as f_in:
                    cloudinary_url = upload_to_cloudinary(f_in, folder="avatars")
                    if cloudinary_url:
                        update_data["avatar"] = cloudinary_url
                        print(f"☁️ [PROFILE UPDATE] Cloudinary Sync Success: {cloudinary_url}")
            except Exception as ce:
                print(f"⚠️ [PROFILE UPDATE] Cloudinary Sync Failed (falling back to local): {ce}")

        except Exception as e:
            logger.error(f"Image upload failed: {e}")
            print(f"❌ [PROFILE UPDATE] Upload Failed: {str(e)}")

    # Atomic Update in MongoDB
    result = await db.employees.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
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
