from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.schemas.schemas import AttendanceResponse, CheckInRequest
from app.services import attendance_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/attendance")

@router.get("/", response_model=List[AttendanceResponse])
async def get_attendance_logs(project_id: Optional[str] = None, skip: int = 0, limit: int = 100):
    """Retrieve all logs using the async MongoDB service."""
    return await attendance_service.get_all_attendance(skip=skip, limit=limit, project_id=project_id)

@router.post("/check-in")
async def employee_check_in(request: dict):
    """Handles an employee check-in with MongoDB."""
    emp_id = request.get('employee_id') or request.get('employeeId')

    logger.info(f"📥 [ATTENDANCE] Check-in request received for: {emp_id}")

    if not emp_id:
        raise HTTPException(status_code=400, detail="Employee ID is missing in request body")

    try:
        log, is_new = await attendance_service.check_in(
            employee_id=emp_id,
            latitude=request.get('latitude'),
            longitude=request.get('longitude'),
            location_name=request.get('location_name')
        )

        if not is_new:
            # ✅ Return 200 with a flag instead of 400 to avoid browser error logs
            return {**log, "already_checked_in": True, "message": "Attendance already marked for today."}

        return {**log, "already_checked_in": False}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔥 CHECK-IN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Server error during check-in")

@router.post("/employee/check-out")
async def employee_check_out(request: dict):
    """Handles an employee check-out with MongoDB."""
    emp_id = request.get('employee_id') or request.get('employeeId')
    logger.info(f"📤 [ATTENDANCE] Check-out request for: {emp_id}")

    if not emp_id:
        raise HTTPException(status_code=400, detail="Employee ID is required in body")
        
    try:
        log = await attendance_service.check_out(employee_id=emp_id)
        
        if not log:
            raise HTTPException(status_code=404, detail="No active check-in found for today.")
        
        return log
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"🔥 CHECK-OUT ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Server error during check-out")
