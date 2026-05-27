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
            "projectId": str(offer.get("project_id")) if offer.get("project_id") else None,
            "project_id": str(offer.get("project_id")) if offer.get("project_id") else None,
            "createdAt": offer.get("updated_at"),
            "created_at": offer.get("updated_at"),
            "updated_at": offer.get("updated_at")
        }

    @staticmethod
    async def create_offer_letter(offer_data: OfferLetterCreate):
        """Creates or updates an offer letter document in MongoDB."""
        if db.db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
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
        if db.db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        offer = await db.offers.find_one({"employee_id": employee_id})
        if not offer:
            raise HTTPException(status_code=404, detail="Offer letter not found")
        return OfferLetterService.format_offer_letter(offer)

    @staticmethod
    async def get_all_offer_letters(skip: int = 0, limit: int = 100, project_id: str = None):
        """Returns all offer letters with strict project isolation."""
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
            # Enforce isolation: return unassigned offer letters only if no project_id
            query["project_id"] = {"$in": [None, "", "null", "undefined"]}
        
        cursor = db.offers.find(query).sort("updated_at", -1).skip(skip).limit(limit)
        raw_offers = await cursor.to_list(length=limit)
        return [OfferLetterService.format_offer_letter(o) for o in raw_offers]

    @staticmethod
    def generate_offer_letter_pdf(offer_data: dict):
        """Generates a professional PDF from the MongoDB document."""
        import subprocess
        import json
        
        current_date_obj = datetime.now()
        
        # Map data for the Node.js script
        mapped_data = {
            "candidateName": offer_data.get("name") or "Unknown Candidate",
            "candidateAddress": "Ainada, Visakhapatnam, Andhrapradesh 535005.",
            "offerDate": current_date_obj.strftime("%B %d, %Y"),
            "jobTitle": offer_data.get("role") or "Employee",
            "department": "Development",
            "reportingManager": "Manager",
            "joiningDate": offer_data.get("joining_date") or current_date_obj.strftime("%B %d, %Y"),
            "workLocation": offer_data.get("location") or "Rolugunta[Visakhapatnam]",
            "ctc": str(offer_data.get("package") or "0")
        }
        
        temp_pdf = os.path.join(ASSETS_DIR, f"Offer_Letter_{offer_data.get('employee_id')}.pdf")
        
        # Execute the Node.js generator
        script_path = os.path.join(os.path.dirname(__file__), "generate_offer.js")
        letterhead_path = os.path.join(BACKEND_ROOT, "static", "offer_letters", "LETTER HEAD.pdf")
        
        # Fallback to any other potential location if needed, otherwise rely on letterhead_path
        if not os.path.exists(letterhead_path):
            letterhead_path = os.path.join(os.path.dirname(__file__), "LETTER HEAD.pdf")
            
        try:
            result = subprocess.run(
                ["node", script_path, json.dumps(mapped_data), letterhead_path, temp_pdf],
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            print("Node.js PDF Generation Error:", e.stderr)
            raise Exception(f"PDF generation error: {e.stderr}")
            
        return temp_pdf
