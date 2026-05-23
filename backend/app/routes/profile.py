import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from typing import Optional
from bson import ObjectId
from datetime import datetime
from app.db.mongo import db
from app.schemas.schemas import UserResponse, FaceRegisterRequest
from app.routes.auth import get_current_user, verify_project_access
from app.core.roles import Role
from app.utils.cloudinary_utils import upload_image as upload_to_cloudinary

from pymongo import ReturnDocument

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile")

@router.get("/profile/{user_id}", response_model=UserResponse)
async def get_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve profile from MongoDB using internal ObjectId."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        user = await db.employees.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # RBAC: Check project isolation
        if current_user["role"] != Role.SUPER_ADMIN:
            verify_project_access(current_user, user.get("project_id"))

        user["id"] = str(user["_id"])
        return user
    except HTTPException: raise
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid user ID format")

@router.put("/update-profile")
async def update_profile(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    joining_date: str = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    """Update profile using Cloudinary directly (No local storage)."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    try:
        user_id = current_user.get("id")
        logger.info(f"🚀 [UPLOAD] Received update for {user_id}")
        logger.info(f"📝 Name: {name} | Email: {email}")
        logger.info(f"🖼️ File: {profile_image.filename if profile_image else 'None'}")
        
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

        if profile_image and profile_image.filename:
            contents = await profile_image.read()
            cloudinary_url = upload_to_cloudinary(contents, folder="avatars")
            
            # 🛡️ Only update if upload actually worked. 
            # If it failed (returned None), format_employee will auto-generate a name-based avatar.
            if cloudinary_url:
                update_data["avatar"] = cloudinary_url

        result = await db.employees.find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        from app.services.employee_service import format_employee
        return {
            "message": "Profile updated successfully",
            "user": format_employee(result)
        }
    except Exception as e:
        logger.error(f"🔥 PROFILE UPDATE CRASH: {str(e)}")
        import traceback
        error_trace = traceback.format_exc()
        logger.error(error_trace)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/register-face")
async def register_face(
    request: FaceRegisterRequest,
    current_user: dict = Depends(get_current_user)
):
    """Saves the employee's face encoding for authentication."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        user_id = current_user.get("id")
        descriptor = request.face_descriptor

        if not descriptor or len(descriptor) != 128:
            raise HTTPException(status_code=400, detail="Invalid face descriptor. Must be 128 floats.")

        result = await db.employees.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"face_encoding": descriptor}}
        )

        if result.modified_count == 0:
            # Check if user exists but nothing changed (descriptor might be identical)
            user = await db.employees.find_one({"_id": ObjectId(user_id)})
            if not user:
                 raise HTTPException(status_code=404, detail="User not found")

        return {"message": "Face registered successfully ✅"}
    except Exception as e:
        logger.error(f"FACE REGISTRATION ERROR: {str(e)}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Failed to register face")
