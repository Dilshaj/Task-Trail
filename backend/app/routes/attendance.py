from app.schemas.schemas import AttendanceResponse, CheckInRequest
from app.services import attendance_service
from app.routes.auth import get_current_user, get_project_filter, require_role, verify_project_access
from app.core.roles import Role
from fastapi import APIRouter, HTTPException, status, Request, Query, Depends
from fastapi.responses import StreamingResponse
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/my-attendance", response_model=List[AttendanceResponse])
async def get_my_attendance(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve personal attendance logs for the logged-in employee."""
    try:
        emp_id = current_user.get("employee_id")
        if not emp_id:
            logger.error(f"AUTH ERROR: User {current_user.get('_id')} has no employee_id")
            raise HTTPException(status_code=400, detail="Employee ID not found in token")
            
        logs = await attendance_service.get_all_attendance(skip=skip, limit=limit, employee_id=emp_id)
        logger.info(f"API SUCCESS: Found {len(logs)} logs for {emp_id}")
        return logs
    except Exception as e:
        logger.error(f"ATTENDANCE_MY ERROR: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/current-status/{employee_id}")
async def get_employee_current_status(
    employee_id: str,
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Retrieves current check-in status for an employee."""
    # RBAC: TEAM_LEAD can only see status of employees in their project
    if enforced_project_id:
        from app.services import employee_service
        emp = await employee_service.get_employee_by_employee_id(employee_id) or await employee_service.get_employee_by_id(employee_id)
        if emp:
            verify_project_access(current_user, emp.get("projectId"))

    return await attendance_service.get_employee_status(employee_id)

@router.get("", response_model=List[AttendanceResponse])
async def get_attendance_logs(
    project_id: Optional[str] = Query(None), 
    skip: int = 0, 
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Retrieve all logs using the async MongoDB service."""
    target_project = enforced_project_id or project_id
    return await attendance_service.get_all_attendance(skip=skip, limit=limit, project_id=target_project)

@router.get("/admin/export")
async def export_attendance(
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN])),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Generates and streams an Excel attendance report."""
    logger.info("[ATTENDANCE] Exporting attendance data to Excel...")
    try:
        # If TL, they can only export their own project
        output = await attendance_service.export_attendance_to_excel(project_id=enforced_project_id)
        
        headers = {
            'Content-Disposition': 'attachment; filename="attendance_report.xlsx"',
            'Cache-Control': 'no-cache'
        }
        
        return StreamingResponse(
            output, 
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers=headers
        )
    except Exception as e:
        logger.error(f"[EXPORT ROUTE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-in")
async def employee_check_in(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Handles an employee check-in with MongoDB."""
    body = await request.json()
    emp_id = body.get('employee_id') or body.get('employeeId')

    logger.info(f"[ATTENDANCE] Check-in request received for: {emp_id}")

    if not emp_id:
        raise HTTPException(status_code=400, detail="Employee ID is missing in request body")

    # Security: Only allow checking in for oneself
    if current_user["employee_id"] != emp_id:
        raise HTTPException(status_code=403, detail="Not authorized to check in for another employee")

    try:
        log, is_new = await attendance_service.check_in(
            employee_id=emp_id,
            latitude=body.get('latitude'),
            longitude=body.get('longitude'),
            location_name=body.get('location_name'),
            location_source=body.get('location_source'),
            location_accuracy=body.get('location_accuracy'),
            face_descriptor=body.get('face_descriptor'),
            request_meta={
                "client_ip": request.client.host if request.client else None,
                "x_forwarded_for": request.headers.get("x-forwarded-for")
            }
        )

        if not is_new:
            # ✅ Return 200 with a flag instead of 400 to avoid browser error logs
            return {**log, "already_checked_in": True, "message": "Attendance already marked for today."}

        return {**log, "already_checked_in": False}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CHECK-IN ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Server error during check-in")

@router.post("/employee/check-out")
async def employee_check_out(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    """Handles an employee check-out with MongoDB."""
    emp_id = payload.get('employee_id') or payload.get('employeeId')
    logger.info(f"[ATTENDANCE] Check-out request for: {emp_id}")

    if not emp_id:
        raise HTTPException(status_code=400, detail="Employee ID is required in body")
        
    # Security: Only allow checking out for oneself
    if current_user["employee_id"] != emp_id:
        raise HTTPException(status_code=403, detail="Not authorized to check out for another employee")
        
    try:
        log = await attendance_service.check_out(employee_id=emp_id)
        
        if not log:
            raise HTTPException(status_code=404, detail="No active check-in found for today.")
        
        return log
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CHECK-OUT ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Server error during check-out")
