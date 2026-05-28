from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime
import logging
import traceback
from typing import List, Optional

from app.core.roles import Role
from app.db.mongo import db
from app.services import auth_service
from app.core.config import settings
from app.schemas.schemas import LoginRequest, ChangePasswordRequest
from app.middleware.rate_limiter import rate_limit_login

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
        if raw_role in ["ADMIN", "SUPER_ADMIN", "MANAGEMENT"]: 
            user["role"] = Role.SUPER_ADMIN
        elif raw_role == "TEAM_LEAD":
            user["role"] = Role.TEAM_LEAD
        elif raw_role == "DOMAIN_LEAD":
            user["role"] = Role.DOMAIN_LEAD
        else:
            user["role"] = Role.EMPLOYEE
            
        # Attach to request state for downstream use
        request.state.user = user
        return user
    except JWTError as e:
        logger.error(f"JWT VALIDATION FAILED: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"AUTH DEPENDENCY ERROR: {str(e)}")
        logger.error(traceback.format_exc())
        raise credentials_exception

# --- RBAC UTILITIES ---

def require_role(allowed_roles: List[Role]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            logger.warning(f"RBAC REJECTION: User {current_user.get('employee_id')} (Role: {user_role}) attempted to access restricted resource. Required: {allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not have sufficient permissions."
            )
        return current_user
    return role_checker

async def get_project_filter(current_user: dict = Depends(get_current_user)):
    """
    Returns a project_id or None based on user role for data isolation.
    """
    role = current_user.get("role")
    if role == Role.SUPER_ADMIN:
        return None
        
    p_id = current_user.get("project_id")
    if role in [Role.TEAM_LEAD, Role.DOMAIN_LEAD] and not p_id:
        logger.error(f"❌ {role} ERROR: User {current_user['employee_id']} has no project_id assigned.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: {role} has no project assigned."
        )
    return str(p_id) if p_id else ""

def verify_project_access(user: dict, project_id: str):
    """
    Explicit project isolation check.
    """
    if user.get("role") == Role.SUPER_ADMIN:
        return
        
    user_project = str(user.get("project_id") or "")
    target_project = str(project_id or "")
    
    if user_project != target_project:
        logger.warning(f"ISOLATION REJECTION: User {user['employee_id']} (Project: {user_project}) attempted to access Project: {target_project}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Resource belongs to another project."
        )

def get_enforced_domain(current_user: dict) -> Optional[str]:
    """
    Returns a normalized domain for DOMAIN_LEAD users.
    """
    if current_user.get("role") != Role.DOMAIN_LEAD:
        return None
    domain = current_user.get("domain")
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Domain Lead is not assigned to any domain."
        )
    return str(domain).strip()

async def verify_domain_employee_access(current_user: dict, employee_role: str):
    """
    DOMAIN_LEAD cannot access employees outside the assigned domain.
    """
    if current_user.get("role") != Role.DOMAIN_LEAD:
        return
    from app.utils.domain_utils import is_employee_in_domain
    target_domain = get_enforced_domain(current_user)
    if not is_employee_in_domain(employee_role or "", target_domain):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Employee belongs to another domain."
        )

@router.post("/login")
async def login(request: LoginRequest, _: None = Depends(rate_limit_login)):
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
            logger.warning(f"[AUTH FAILED] Credentials rejected for: {identifier}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        # Standardize role for Token
        raw_role = str(user.get("role", "EMPLOYEE")).upper()
        if raw_role in ["ADMIN", "SUPER_ADMIN", "MANAGEMENT"]:
            final_role = Role.SUPER_ADMIN
        elif raw_role == "TEAM_LEAD":
            final_role = Role.TEAM_LEAD
        elif raw_role == "DOMAIN_LEAD":
            final_role = Role.DOMAIN_LEAD
        else:
            final_role = Role.EMPLOYEE

        # Generate Tokens with role, project_id and domain
        token_data = {
            "sub": user["employee_id"], 
            "role": final_role,
            "project_id": str(user.get("project_id") or ""),
            "projectName": str(user.get("project_name") or user.get("projectName") or ""),
            "domain": str(user.get("domain") or ""),
            "roleType": str(user.get("roleType") or final_role)
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
    except JWTError as e:
        logger.error(f"JWT REFRESH FAILED: {str(e)}")
        raise credentials_exception

    # Check if the token matches what we have in DB
    user = await db.employees.find_one({"employee_id": employee_id, "refresh_token": refresh_token})
    if not user:
        raise credentials_exception

    # Generate new access token with full RBAC data
    raw_role = str(user.get("role", "EMPLOYEE")).upper()
    if raw_role in ["ADMIN", "SUPER_ADMIN", "MANAGEMENT"]:
        final_role = Role.SUPER_ADMIN
    elif raw_role == "TEAM_LEAD":
        final_role = Role.TEAM_LEAD
    elif raw_role == "DOMAIN_LEAD":
        final_role = Role.DOMAIN_LEAD
    else:
        final_role = Role.EMPLOYEE

    token_data = {
        "sub": user["employee_id"], 
        "role": final_role,
        "project_id": str(user.get("project_id") or ""),
        "projectName": str(user.get("project_name") or user.get("projectName") or ""),
        "domain": str(user.get("domain") or ""),
        "roleType": str(user.get("roleType") or final_role)
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

# End of file
