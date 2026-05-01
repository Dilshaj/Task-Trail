from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
import logging

from app.db.mongo import db
from app.schemas.schemas import PaySlipCreate, PaySlipResponse

logger = logging.getLogger(__name__)

# ❌ REMOVED PREFIX TO BE EXPLICIT
router = APIRouter()

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

@router.get("/pay-slips/latest/{employee_id}")
async def download_latest_pay_slip(employee_id: str):
    """Finds and downloads the latest pay slip."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    logger.info(f"📥 [LATEST] Request for: {employee_id}")
    try:
        from app.services.pay_slip_service import PaySlipService
        from fastapi.responses import FileResponse
        import re

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
async def download_pay_slip_id(id: str):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    from app.services.pay_slip_service import PaySlipService
    from fastapi.responses import FileResponse
    data = await PaySlipService.get_pay_slip_data(id)
    pdf_path, filename = PaySlipService.generate_pay_slip_pdf(data)
    return FileResponse(path=pdf_path, media_type="application/pdf", filename=filename)

@router.get("/pay-slips")
async def get_all_slips(project_id: Optional[str] = None):
    """Admin endpoint to see all pay slips with strict project isolation."""
    if db.db is None:
        return []
    query = {}
    if project_id and str(project_id).lower() not in ["null", "undefined", "none", ""]:
        # Robust Isolation: Match both string and ObjectId formats
        pids = [str(project_id)]
        try: pids.append(ObjectId(project_id))
        except: pass
        query["project_id"] = {"$in": pids}
    else:
        # Enforce isolation: Return unassigned slips only if no project_id
        query["project_id"] = {"$in": [None, "", "null", "undefined"]}
        
    cursor = db.pay_slips.find(query).sort("created_at", -1)
    slips = await cursor.to_list(100)
    return [format_payslip(s) for s in slips]

@router.post("/pay-slips")
async def create_slip(payload: PaySlipCreate):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    new_slip = payload.model_dump()
    new_slip["created_at"] = datetime.utcnow()
    result = await db.pay_slips.insert_one(new_slip)
    new_slip["_id"] = result.inserted_id
    return format_payslip(new_slip)

@router.get("/pay-slips/my/{employee_id}")
async def get_my_slips(employee_id: str):
    if db.db is None:
        return []
    cursor = db.pay_slips.find({"employee_id": employee_id}).sort("created_at", -1)
    slips = await cursor.to_list(100)
    return [format_payslip(s) for s in slips]
