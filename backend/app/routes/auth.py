from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.schemas.schemas import LoginRequest, ChangePasswordRequest
from app.services import auth_service
from app.db.mongo import db
import os
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "EduProva_Default_Secret_Key_Change_Me")
ALGORITHM = "HS256"

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency to validate JWT and return current user from MongoDB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if db.db is None:
        raise credentials_exception
    try:
        # Use token directly
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id: str = payload.get("sub")
        if employee_id is None:
            raise credentials_exception
            
        user = await db.employees.find_one({"employee_id": employee_id})
        if user is None:
            raise credentials_exception
        
        # Flatten/Normalize user for usage in other routes
        user["id"] = str(user["_id"])
        return user
    except JWTError:
        raise credentials_exception
    except Exception as e:
        logger.error(f"AUTH DEPENDENCY ERROR: {str(e)}")
        raise credentials_exception

@router.post("/login")
async def login(request: LoginRequest):
    """
    Login endpoint mapped to the EXACT contract expected by Admin/User Dashboards.
    """
    try:
        identifier = request.email or request.employee_id
        logger.info(f"LOGIN ATTEMPT: {identifier}")
        
        if not identifier:
            raise HTTPException(status_code=400, detail="Missing Email or Employee ID")

        # Authenticate via MongoDB
        user = await auth_service.authenticate_user(identifier, request.password)
        
        if not user:
            logger.warning(f"AUTH FAILED: {identifier}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Generate Tokens
        token_data = {"sub": user["employee_id"], "role": user["role"]}
        access_token = auth_service.create_access_token(data=token_data)
        refresh_token = auth_service.create_refresh_token(data=token_data)

        if db.db is not None:
            try:
                # Store refresh token in DB (optional but recommended for revocation)
                await db.employees.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"refresh_token": refresh_token}}
                )
            except Exception as e:
                logger.warning(f"Could not store refresh token in DB: {e}")

        from app.services.employee_service import format_employee
        fm_user = format_employee(user)
        
        # FLATTENED RESPONSE: Matches Login.jsx/App.jsx expectations
        return {
            "token": access_token,
            "refreshToken": refresh_token,
            **fm_user,
            "isFirstLogin": user.get("is_first_login", False)
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"LOGIN CRASH: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal Server Error during Authentication.")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """
    Refreshes the access token using a valid refresh token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if db.db is None:
        raise credentials_exception
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise credentials_exception
            
        employee_id: str = payload.get("sub")
        if employee_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Check if the token matches what we have in DB
    user = await db.employees.find_one({"employee_id": employee_id, "refresh_token": refresh_token})
    if not user:
        raise credentials_exception

    # Generate new access token
    new_access_token = auth_service.create_access_token(
        data={"sub": user["employee_id"], "role": user["role"]}
    )

    return {"token": new_access_token}

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """
    Securely update the user's password.
    """
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # 1. Verify current password
    stored_hash = current_user.get("password_hash") or current_user.get("password")
    if not auth_service.verify_password(request.current_password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # 2. Hash new password
    new_hash = auth_service.get_password_hash(request.new_password)
    
    # 3. Update in DB
    try:
        await db.employees.update_one(
            {"employee_id": current_user["employee_id"]},
            {"$set": {
                "password_hash": new_hash,
                "updated_at": datetime.utcnow()
            }}
        )
        return {"message": "Password updated successfully"}
    except Exception as e:
        logger.error(f"PASSWORD UPDATE FAILED: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update password in database")

