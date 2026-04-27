from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from app.schemas.schemas import OfferLetterCreate, OfferLetterResponse
from app.services.offer_letter_service import OfferLetterService
from typing import List
import os

router = APIRouter(prefix="/offer-letter")

@router.post("/", response_model=OfferLetterResponse, status_code=status.HTTP_201_CREATED)
async def create_offer_letter(offer_data: OfferLetterCreate):
    """Admin endpoint to create/update offer letter details in MongoDB."""
    try:
        return await OfferLetterService.create_offer_letter(offer_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[OfferLetterResponse])
async def get_offer_letters(skip: int = 0, limit: int = 100, project_id: str = None):
    """Admin endpoint to retrieve all offer letters."""
    return await OfferLetterService.get_all_offer_letters(skip=skip, limit=limit, project_id=project_id)

@router.get("/{employee_id}")
async def download_offer_letter(employee_id: str):
    """Employee endpoint to generate and download their offer letter PDF."""
    try:
        offer = await OfferLetterService.get_offer_letter_data(employee_id)
        pdf_path = OfferLetterService.generate_offer_letter_pdf(offer)
        
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=f"Offer_Letter_{employee_id}.pdf"
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")
