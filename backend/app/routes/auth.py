from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime
import logging
import traceback
from typing import List

from app.core.roles import Role
from app.db.mongo import db
from app.services import auth_service
from app.core.config import settings
from app.schemas.schemas import LoginRequest, ChangePasswordRequest

router = APIRouter(prefix="/auth")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
logger = logging.getLogger(__name__)

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        employee_id: str = payload.get("sub")
        if employee_id is None:
            raise credentials_exception
            
        user = await db.employees.find_one({"employee_id": employee_id})
        if user is None:
            raise credentials_exception
        
        # Flatten/Normalize user for usage in other routes
        user["id"] = str(user["_id"])
        
        # Standardize role to Role enum
        raw_role = str(user.get("role", "EMPLOYEE")).upper()
        if raw_role in ["ADMIN", "SUPER_ADMIN"]: 
            user["role"] = Role.SUPER_ADMIN
        elif raw_role == "TEAM_LEAD":
            user["role"] = Role.TEAM_LEAD
        else:
            user["role"] = Role.EMPLOYEE
            
        # Attach to request state for downstream use
        request.state.user = user
        return user
    except JWTError:
        raise credentials_exception
    except Exception as e:
        logger.error(f"AUTH DEPENDENCY ERROR: {str(e)}")
        raise credentials_exception

def require_role(allowed_roles: List[Role]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            logger.warning(f"🚫 RBAC REJECTION: User {current_user['employee_id']} (Role: {current_user['role']}) attempted to access restricted resource. Required: {allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have sufficient permissions."
            )
        return current_user
    return role_checker

async def get_project_filter(current_user: dict = Depends(get_current_user)):
    """
    Returns a project_id or None based on user role.
    Strictly enforces that TEAM_LEAD can only see their assigned project.
    """
    if current_user["role"] == Role.SUPER_ADMIN:
        return None  # No restriction for Super Admin
        
    if current_user["role"] == Role.TEAM_LEAD:
        project_id = current_user.get("project_id")
        if not project_id:
            logger.error(f"❌ TEAM_LEAD ERROR: User {current_user['employee_id']} has no project_id assigned.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Team Lead has no project assigned."
            )
        return str(project_id)
        
    # Employees also restricted by project_id for most lookups
    return str(current_user.get("project_id", ""))

def verify_project_access(user: dict, project_id: str):
    """
    🔒 RBAC Enforcement: Ensures TEAM_LEAD or EMPLOYEE can only access their assigned project.
    """
    if user["role"] == Role.SUPER_ADMIN:
        return # Full access
        
    user_project_id = str(user.get("project_id") or "")
    target_project_id = str(project_id or "")
    
    if user_project_id != target_project_id:
        logger.warning(f"🚫 ISOLATION REJECTION: User {user['employee_id']} (Project: {user_project_id}) attempted to access Project: {target_project_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: You are restricted to project {user_project_id}"
        )

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
            logger.warning(f"❌ [AUTH FAILED] Credentials rejected for: {identifier}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Standardize role for Token
        raw_role = str(user.get("role", "EMPLOYEE")).upper()
        if raw_role in ["ADMIN", "SUPER_ADMIN"]:
            final_role = Role.SUPER_ADMIN
        elif raw_role == "TEAM_LEAD":
            final_role = Role.TEAM_LEAD
        else:
            final_role = Role.EMPLOYEE

        # Generate Tokens with role and project_id
        token_data = {
            "sub": user["employee_id"], 
            "role": final_role,
            "project_id": str(user.get("project_id") or "")
        }
        
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

    # Generate new access token with full RBAC data
    raw_role = str(user.get("role", "EMPLOYEE")).upper()
    if raw_role in ["ADMIN", "SUPER_ADMIN"]:
        final_role = Role.SUPER_ADMIN
    elif raw_role == "TEAM_LEAD":
        final_role = Role.TEAM_LEAD
    else:
        final_role = Role.EMPLOYEE

    token_data = {
        "sub": user["employee_id"], 
        "role": final_role,
        "project_id": str(user.get("project_id") or "")
    }
    new_access_token = auth_service.create_access_token(data=token_data)
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
                "is_first_login": False,
                "updated_at": datetime.utcnow()
            }}
        )
        return {"message": "Password updated successfully"}
    except Exception as e:
        logger.error(f"PASSWORD UPDATE FAILED: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update password in database")

# --- RBAC UTILITIES ---

def get_project_filter(current_user: dict = Depends(get_current_user)):
    """
    Dependency to return project isolation filter.
    SUPER_ADMIN -> None (no filter)
    TEAM_LEAD -> project_id (enforce isolation)
    """
    role = str(current_user.get("role", "")).upper()
    p_id = current_user.get("project_id")

    if role == "SUPER_ADMIN" or role == "ADMIN":
        logger.info(f"🔓 [RBAC] User: {current_user.get('employee_id')} is SUPER_ADMIN. NO FILTER APPLIED.")
        return None
    
    logger.info(f"🔒 [RBAC] Enforcing Project Filter: {p_id} for User: {current_user.get('employee_id')} (Role: {role})")
    return p_id

def verify_project_access(user: dict, resource_project_id: str):
    """
    Explicitly block access if user attempts to touch a resource outside their project.
    """
    if user["role"] == Role.SUPER_ADMIN:
        return True
    
    user_project = str(user.get("project_id") or "")
    resource_project = str(resource_project_id or "")
    
    if user_project != resource_project:
        logger.warning(f"🚨 [RBAC REJECTION] User {user.get('employee_id')} (Project: {user_project}) tried to access Resource (Project: {resource_project})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Resource belongs to another project."
        )
    return True

