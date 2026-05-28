from fastapi import APIRouter, HTTPException, status, Depends, Query
from fastapi.responses import StreamingResponse
from app.schemas.schemas import OfferLetterCreate, OfferLetterResponse
from app.services.offer_letter_service import OfferLetterService
from app.routes.auth import get_current_user, get_project_filter, require_role, verify_project_access
from app.core.roles import Role
from typing import List, Optional
import os

router = APIRouter(prefix="/offer-letter")

@router.post("/", response_model=OfferLetterResponse, status_code=status.HTTP_201_CREATED)
async def create_offer_letter(
    offer_data: OfferLetterCreate,
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN]))
):
    """Admin endpoint to create/update offer letter details in MongoDB."""
    try:
        return await OfferLetterService.create_offer_letter(offer_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[OfferLetterResponse])
async def get_offer_letters(
    skip: int = 0, 
    limit: int = 100, 
    project_id: Optional[str] = Query(None),
    current_user: dict = Depends(require_role([Role.SUPER_ADMIN])),
    enforced_project_id: Optional[str] = Depends(get_project_filter)
):
    """Admin endpoint to retrieve all offer letters."""
    target_project = enforced_project_id or project_id
    return await OfferLetterService.get_all_offer_letters(skip=skip, limit=limit, project_id=target_project)

@router.get("/{employee_id}")
async def download_offer_letter(
    employee_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Employee endpoint to generate and download their offer letter PDF."""
    # RBAC: Only self or Admin/TL
    if current_user["role"] == Role.EMPLOYEE and current_user["employee_id"] != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    try:
        offer = await OfferLetterService.get_offer_letter_data(employee_id)
        
        # TL check
        if current_user["role"] == Role.TEAM_LEAD:
             verify_project_access(current_user, offer.get("projectId"))

        pdf_buffer = OfferLetterService.generate_offer_letter_pdf(offer)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Offer_Letter_{employee_id}.pdf"
            }
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
