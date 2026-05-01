from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
import logging

from app.db.mongo import db
from app.schemas.schemas import LeaveRequestCreate, LeaveRequestResponse

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
        "createdAt": leave_log.get("created_at"),
        "created_at": leave_log.get("created_at")
    }

@router.post("/apply-leave", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
async def apply_leave(leave_data: LeaveRequestCreate):
    """Submit a new leave request to MongoDB."""
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        new_leave = leave_data.model_dump()
        new_leave["status"] = "Pending"
        new_leave["created_at"] = datetime.utcnow()
        
        # FIX: Use the 'leaves' property which points to 'Leaves' collection
        result = await db.leaves.insert_one(new_leave)
        new_leave["_id"] = result.inserted_id
        return await format_leave(new_leave)
    except Exception as e:
        logger.error(f"Error applying for leave: {e}")
        raise HTTPException(status_code=500, detail="Failed to apply for leave")

@router.get("/my-leaves/{employee_id}", response_model=List[LeaveRequestResponse])
async def get_user_leaves(employee_id: str):
    """Retrieve all leaves for a specific employee."""
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
async def get_all_leaves(project_id: Optional[str] = Query(None)):
    """Admin endpoint to see all submitted leave requests with strict project isolation."""
    if db.db is None:
        return []
    try:
        query = {}
        if project_id and str(project_id).lower() not in ["null", "undefined", "none", ""]:
            # Get all employees in this project
            pids = [str(project_id)]
            try: pids.append(ObjectId(project_id))
            except: pass
            
            cursor_emp = db.employees.find({"project_id": {"$in": pids}})
            project_employees = await cursor_emp.to_list(length=1000)
            emp_ids = [e.get("employee_id") for e in project_employees]
            query["employee_id"] = {"$in": emp_ids}
        else:
            # Enforce isolation: return unassigned leaves only if no project_id
            cursor_emp = db.employees.find({"project_id": {"$in": [None, "", "null", "undefined"]}})
            unassigned_employees = await cursor_emp.to_list(length=1000)
            emp_ids = [e.get("employee_id") for e in unassigned_employees]
            query["employee_id"] = {"$in": emp_ids}
            
        cursor = db.leaves.find(query).sort("created_at", -1)
        leaves = await cursor.to_list(length=500)
        return [await format_leave(l) for l in leaves]
    except Exception as e:
        logger.error(f"Error getting all leaves: {e}")
        return []

@router.patch("/update-status/{leave_id}", response_model=LeaveRequestResponse)
async def update_leave_status(leave_id: str, status: str):
    """Approve or Reject a leave request."""
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        updated = await db.leaves.find_one_and_update(
            {"_id": ObjectId(leave_id)},
            {"$set": {"status": status}},
            return_document=True
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Leave request not found")
        return await format_leave(updated)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating leave status: {e}")
        raise HTTPException(status_code=400, detail="Invalid leave request ID")
