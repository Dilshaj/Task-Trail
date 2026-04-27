import os
from datetime import datetime, timedelta, timezone
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from app.db.mongo import db
from app.schemas.schemas import OfferLetterCreate
from fastapi import HTTPException
from bson import ObjectId

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TEMPLATE_DIR = os.path.join(BACKEND_ROOT, "app", "templates", "offer_letter")
TEMPLATE_NAME = "offer_letter.html"
LOGO_PATH = os.path.join(BACKEND_ROOT, "static", "logos", "company_logo.jpg")
ASSETS_DIR = os.path.join(BACKEND_ROOT, "static", "offer_letters")
os.makedirs(ASSETS_DIR, exist_ok=True)

class OfferLetterService:
    @staticmethod
    def format_offer_letter(offer):
        if not offer:
            return None
        return {
            "id": str(offer.get("_id")),
            "_id": str(offer.get("_id")),
            "employeeId": offer.get("employee_id"),
            "employee_id": offer.get("employee_id"),
            "employeeName": offer.get("name"),
            "employee_name": offer.get("name"),
            "name": offer.get("name"),
            "role": offer.get("role"),
            "joiningDate": offer.get("joining_date"),
            "joining_date": offer.get("joining_date"),
            "location": offer.get("location"),
            "package": offer.get("package"),
            "projectId": offer.get("project_id"),
            "project_id": offer.get("project_id"),
            "createdAt": offer.get("updated_at"),
            "created_at": offer.get("updated_at"),
            "updated_at": offer.get("updated_at")
        }

    @staticmethod
    async def create_offer_letter(offer_data: OfferLetterCreate):
        """Creates or updates an offer letter document in MongoDB."""
        offer_dict = {
            "employee_id": offer_data.employee_id,
            "name": offer_data.employee_name,
            "role": offer_data.role,
            "joining_date": offer_data.joining_date,
            "location": offer_data.location,
            "package": offer_data.package,
            "project_id": offer_data.project_id,
            "updated_at": datetime.utcnow()
        }
        
        result = await db.offers.find_one_and_update(
            {"employee_id": offer_data.employee_id},
            {"$set": offer_dict},
            upsert=True,
            return_document=True
        )
        return OfferLetterService.format_offer_letter(result)

    @staticmethod
    async def get_offer_letter_data(employee_id: str):
        """Fetches offer letter document."""
        offer = await db.offers.find_one({"employee_id": employee_id})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer letter not found")
        return OfferLetterService.format_offer_letter(offer)

    @staticmethod
    async def get_all_offer_letters(skip: int = 0, limit: int = 100, project_id: str = None):
        """Returns all offer letters with optional filtering."""
        query = {}
        if project_id:
            query["project_id"] = project_id
        
        cursor = db.offers.find(query).sort("updated_at", -1).skip(skip).limit(limit)
        raw_offers = await cursor.to_list(length=limit)
        return [OfferLetterService.format_offer_letter(o) for o in raw_offers]

    @staticmethod
    def generate_offer_letter_pdf(offer_data: dict):
        """Generates a professional PDF from the MongoDB document."""
        # Note: input is now a dict from MongoDB
        env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
        template = env.get_template(TEMPLATE_NAME)
        
        current_date_obj = datetime.now()
        expiry_date_obj = current_date_obj + timedelta(days=7)
        
        context = {
            "employee_name": offer_data.get("name"),
            "employee_id": offer_data.get("employee_id"),
            "role": offer_data.get("role"),
            "joining_date": offer_data.get("joining_date"),
            "location": offer_data.get("location"),
            "package": offer_data.get("package"),
            "date": current_date_obj.strftime("%B %d, %Y"),
            "expiry_date": expiry_date_obj.strftime("%B %d, %Y"),
            "logo_path": "file:///" + LOGO_PATH.replace("\\", "/")
        }
        
        html_content = template.render(context)
        temp_pdf = os.path.join(ASSETS_DIR, f"Offer_Letter_{offer_data.get('employee_id')}.pdf")
        
        with open(temp_pdf, "wb") as f:
            pisa_status = pisa.CreatePDF(html_content, dest=f)
            
        if pisa_status.err:
            raise Exception("PDF generation error")
            
        return temp_pdf
