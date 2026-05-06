from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
import logging

from app.db.mongo import db
from app.schemas.schemas import PaySlipCreate, PaySlipResponse
from app.routes.auth import get_current_user, get_project_filter, require_role, verify_project_access
from app.core.roles import Role

logger = logging.getLogger(__name__)

# ❌ REMOVED PREFIX TO BE EXPLICIT
router = APIRouter()

@router.get("/pay-slips/latest/{employee_id}")
async def download_latest_pay_slip(
    employee_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Finds and downloads the latest pay slip."""
    # RBAC: Only self or Admin/TL (TL restricted to their project)
    if current_user["role"] == Role.EMPLOYEE:
        if current_user["employee_id"] != employee_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user["role"] == Role.TEAM_LEAD:
        from app.services import employee_service
        emp = await employee_service.get_employee_by_employee_id(employee_id) or await employee_service.get_employee_by_id(employee_id)
        if emp:
            verify_project_access(current_user, emp.get("projectId"))
        
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    logger.info(f"📥 [LATEST] Request for: {employee_id}")
    try:
        from app.services.pay_slip_service import PaySlipService
        from fastapi.responses import FileResponse

        query = {
            "employee_id": {"$in": [employee_id, int(employee_id) if employee_id.isdigit() else -1]}
        }
        
        slip = await db.pay_slips.find_one(query, sort=[("created_at", -1)])
        if not slip:
            logger.warning(f"❌ No slip for {employee_id}")
            raise HTTPException(status_code=404, detail="No payslip found")
            
        data = await PaySlipService.get_pay_slip_data(str(slip["_id"]))
        pdf_path, filename = PaySlipService.generate_pay_slip_pdf(data)
        return FileResponse(path=pdf_path, media_type="application/pdf", filename=filename)
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pay-slips/{id}/download")
async def download_pay_slip_id(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    # RBAC: TL can only download slips for their project
    if current_user["role"] != Role.SUPER_ADMIN:
        slip = await db.pay_slips.find_one({"_id": ObjectId(id)})
        if not slip:
            raise HTTPException(status_code=404, detail="Slip not found")
        if current_user["role"] == Role.TEAM_LEAD:
            verify_project_access(current_user, slip.get("project_id"))
        else: # EMPLOYEE
            if current_user["employee_id"] != slip.get("employee_id"):
                raise HTTPException(status_code=403, detail="Access denied")

    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    from app.services.pay_slip_service import PaySlipService
    from fastapi.responses import FileResponse
    data = await PaySlipService.get_pay_slip_data(id)
    pdf_path, filename = PaySlipService.generate_pay_slip_pdf(data)
    return FileResponse(path=pdf_path, media_type="application/pdf", filename=filename)

@router.get("/pay-slips")
async def get_all_slips(
    project_id: Optional[str] = Query(None),
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN])),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Admin endpoint to see all pay slips with strict project isolation."""
    if db.db is None:
        return []
    query = {}
    target_project = enforced_project_id or project_id
    if target_project and str(target_project).lower() not in ["null", "undefined", "none", ""]:
        # Robust Isolation: Match both string and ObjectId formats
        pids = [str(target_project)]
        try: pids.append(ObjectId(target_project))
        except: pass
        query["project_id"] = {"$in": pids}
        
    cursor = db.pay_slips.find(query).sort("created_at", -1)
    slips = await cursor.to_list(100)
    return [format_payslip(s) for s in slips]

@router.post("/pay-slips")
async def create_slip(
    payload: PaySlipCreate,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN]))
):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    # TL can only create for their project
    if current_user["role"] == Role.TEAM_LEAD:
        emp = await db.employees.find_one({"employee_id": payload.employee_id})
        if not emp or str(emp.get("project_id")) != str(current_user.get("project_id")):
             raise HTTPException(status_code=403, detail="Forbidden: You can only generate slips for your project.")

    new_slip = payload.model_dump()
    new_slip["created_at"] = datetime.utcnow()
    result = await db.pay_slips.insert_one(new_slip)
    new_slip["_id"] = result.inserted_id
    return format_payslip(new_slip)

@router.get("/pay-slips/my/{employee_id}")
async def get_my_slips(
    employee_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == Role.EMPLOYEE and current_user["employee_id"] != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if db.db is None:
        return []
    cursor = db.pay_slips.find({"employee_id": employee_id}).sort("created_at", -1)
    slips = await cursor.to_list(100)
    return [format_payslip(s) for s in slips]

def format_payslip(slip):
    if not slip: return None
    return {
        "id": str(slip.get("_id")),
        "employeeId": slip.get("employee_id"),
        "employeeName": slip.get("employee_name"),
        "month": slip.get("month"),
        "amount": slip.get("amount"),
        "status": slip.get("status", "Generated"),
        "createdAt": slip.get("created_at")
    }
