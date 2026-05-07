from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
import logging

from app.db.mongo import db
from app.schemas.schemas import LeaveRequestCreate, LeaveRequestResponse
from app.routes.auth import get_current_user, get_project_filter, require_role, verify_project_access
from app.core.roles import Role

router = APIRouter(prefix="/employee")
logger = logging.getLogger(__name__)

async def format_leave(leave_log: dict):
    """Utility function to format leave log with ID and user name."""
    if db.db is None:
        user = None
    else:
        try:
            user = await db.employees.find_one({"employee_id": leave_log.get("employee_id")})
        except Exception as e:
            logger.error(f"Error fetching user for leave: {e}")
            user = None
    l_type = leave_log.get("leave_type")
    f_date = leave_log.get("from_date")
    t_date = leave_log.get("to_date")
    return {
        "id": str(leave_log.get("_id")),
        "_id": str(leave_log.get("_id")),
        "employeeId": leave_log.get("employee_id"),
        "employee_id": leave_log.get("employee_id"),
        "userName": user.get("name") if user else "Unknown User",
        "user_name": user.get("name") if user else "Unknown User",
        "leaveType": l_type,
        "leave_type": l_type,
        "type": l_type,
        "fromDate": f_date,
        "from_date": f_date,
        "startDate": f_date,
        "toDate": t_date,
        "to_date": t_date,
        "endDate": t_date,
        "reason": leave_log.get("reason"),
        "status": leave_log.get("status", "Pending"),
        "projectId": str(leave_log.get("project_id", "")),
        "project_id": str(leave_log.get("project_id", "")),
        "createdAt": leave_log.get("created_at"),
        "created_at": leave_log.get("created_at")
    }

@router.post("/apply-leave", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    leave_data: LeaveRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit a new leave request to MongoDB."""
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # RBAC: Ensure user is only applying for themselves unless they are admin/tl
    if current_user["role"] == Role.EMPLOYEE and current_user["employee_id"] != leave_data.employee_id:
        raise HTTPException(status_code=403, detail="Forbidden: You can only apply leave for yourself.")
        
    try:
        new_leave = leave_data.model_dump()
        
        # 🔗 Link to Project automatically
        emp = await db.employees.find_one({"employee_id": leave_data.employee_id})
        if emp:
            p_id = str(emp.get("project_id") or "")
            new_leave["project_id"] = p_id
            logger.info(f"✅ [LEAVE APPLY] Linked employee {leave_data.employee_id} to project {p_id}")
        else:
            logger.warning(f"⚠️ [LEAVE APPLY] Could not find employee {leave_data.employee_id} to link project.")

        # Step 1: Initial status is always PENDING_TEAM_LEAD
        new_leave["status"] = "PENDING_TEAM_LEAD"
        new_leave["created_at"] = datetime.utcnow()
        
        logger.info(f"📝 [LEAVE CREATE] Object: {new_leave}")
        
        result = await db.leaves.insert_one(new_leave)
        new_leave["_id"] = result.inserted_id
        return await format_leave(new_leave)
    except Exception as e:
        logger.error(f"🔥 [LEAVE APPLY ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to apply for leave: {str(e)}")

@router.get("/my-leaves/{employee_id}", response_model=List[LeaveRequestResponse])
async def get_user_leaves(
    employee_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all leaves for a specific employee."""
    # RBAC: Ensure user can only see their own leaves unless admin/tl
    if current_user["role"] == Role.EMPLOYEE and current_user["employee_id"] != employee_id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied.")
        
    if db.db is None:
        return []
    try:
        cursor = db.leaves.find({"employee_id": employee_id}).sort("created_at", -1)
        leaves = await cursor.to_list(length=100)
        return [await format_leave(l) for l in leaves]
    except Exception as e:
        logger.error(f"Error getting user leaves: {e}")
        return []

@router.get("/all-leaves", response_model=List[LeaveRequestResponse])
async def get_all_leaves(
    project_id: Optional[str] = Query(None),
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN, Role.TEAM_LEAD])),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Admin endpoint to see all submitted leave requests with strict project and status isolation."""
    logger.info(f"🔍 [LEAVE FETCH] Role: {current_user.get('role')}, enforced_project_id: {enforced_project_id}")
    if db.db is None:
        return []
    try:
        query = {}
        
        # 1. Project Isolation
        target_project = enforced_project_id or project_id
        if target_project and str(target_project).lower() not in ["null", "undefined", "none", ""]:
            pids = [str(target_project)]
            try: pids.append(ObjectId(target_project))
            except: pass
            query["project_id"] = {"$in": pids}
            
        # 2. Status Isolation (Multi-level Workflow)
        if current_user["role"] == Role.TEAM_LEAD:
            # TL sees what they need to approve + their team's history
            query["status"] = {"$in": ["PENDING_TEAM_LEAD", "APPROVED", "REJECTED"]}
            logger.info(f"🛡️ [RBAC] TL Filter: project_id={target_project}, status=[PENDING_TEAM_LEAD, APPROVED, REJECTED]")
        elif current_user["role"] == Role.SUPER_ADMIN:
            # Management sees what they need to approve + all history
            query["status"] = {"$in": ["PENDING_MANAGEMENT", "APPROVED", "REJECTED"]}
            logger.info(f"🛡️ [RBAC] Management Filter: status=[PENDING_MANAGEMENT, APPROVED, REJECTED]")

        cursor = db.leaves.find(query).sort("created_at", -1)
        leaves = await cursor.to_list(length=500)
        logger.info(f"✅ [LEAVE FETCH] Found {len(leaves)} requests matching criteria.")
        return [await format_leave(l) for l in leaves]
    except Exception as e:
        logger.error(f"🔥 [LEAVE FETCH ERROR] {e}")
        return []

@router.patch("/update-status/{leave_id}", response_model=LeaveRequestResponse)
async def update_leave_status(
    leave_id: str, 
    status: str,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN, Role.TEAM_LEAD]))
):
    """
    Approve or Reject a leave request with 2-level workflow:
    - Team Lead: PENDING_TEAM_LEAD -> PENDING_MANAGEMENT or REJECTED
    - Management: PENDING_MANAGEMENT -> APPROVED or REJECTED
    """
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        leave = await db.leaves.find_one({"_id": ObjectId(leave_id)})
        if not leave:
            raise HTTPException(status_code=404, detail="Leave request not found")
            
        current_status = leave.get("status", "PENDING_TEAM_LEAD")
        
        # 🛡️ Level 1: Team Lead Approval
        if current_user["role"] == Role.TEAM_LEAD:
            # 1. Check Project Isolation
            emp = await db.employees.find_one({"employee_id": leave.get("employee_id")})
            if not emp or str(emp.get("project_id")) != str(current_user.get("project_id")):
                raise HTTPException(status_code=403, detail="Forbidden: You can only approve leaves for your project employees.")
            
            # 2. Check Workflow Level
            if current_status != "PENDING_TEAM_LEAD":
                raise HTTPException(status_code=400, detail=f"Invalid Action: This request is already at '{current_status}' stage.")
            
            # 3. Restrict target status
            if status not in ["PENDING_MANAGEMENT", "REJECTED"]:
                raise HTTPException(status_code=400, detail="Invalid Status: Team Lead can only set to 'PENDING_MANAGEMENT' or 'REJECTED'.")

        # 🛡️ Level 2: Management Approval
        elif current_user["role"] == Role.SUPER_ADMIN:
            # 1. Check Workflow Level (Prevent skipping)
            if current_status != "PENDING_MANAGEMENT":
                raise HTTPException(status_code=400, detail="Invalid Action: Management can only approve requests already approved by Team Lead (PENDING_MANAGEMENT).")
            
            # 2. Restrict target status
            if status not in ["APPROVED", "REJECTED"]:
                raise HTTPException(status_code=400, detail="Invalid Status: Management can only set to 'APPROVED' or 'REJECTED'.")

        updated = await db.leaves.find_one_and_update(
            {"_id": ObjectId(leave_id)},
            {"$set": {"status": status, "updated_by": current_user["employee_id"], "updated_at": datetime.utcnow()}},
            return_document=True
        )
        
        # 🔔 Notify Employee
        from app.services import notification_service
        await notification_service.create_notification(
            employee_id=updated["employee_id"],
            message=f"Your leave request has been {status.replace('_', ' ').lower()}",
            notification_type="leave"
        )
        
        return await format_leave(updated)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating leave status: {e}")
        raise HTTPException(status_code=400, detail=f"Request failed: {str(e)}")
