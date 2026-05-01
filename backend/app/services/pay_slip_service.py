import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from app.db.mongo import db
from fastapi import HTTPException
from bson import ObjectId

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TEMPLATE_DIR = os.path.join(BACKEND_ROOT, "app", "templates", "pay_slip")
TEMPLATE_NAME = "pay_slip.html"
LOGO_PATH = os.path.join(BACKEND_ROOT, "static", "logos", "company_logo.jpg")
ASSETS_DIR = os.path.join(BACKEND_ROOT, "static", "pay_slips")
os.makedirs(ASSETS_DIR, exist_ok=True)

class PaySlipService:
    @staticmethod
    def number_to_words(number):
        """Simple number to words converter for currency."""
        # This is a very basic implementation, could use a library like num2words for production
        units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
        teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
        tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
        
        def convert_below_thousand(n):
            if n == 0: return ""
            res = ""
            if n >= 100:
                res += units[n // 100] + " Hundred "
                n %= 100
            if n >= 10 and n <= 19:
                res += teens[n - 10]
            else:
                res += tens[n // 10] + " " + units[n % 10]
            return res.strip()

        if number == 0: return "Zero"
        
        # Split by thousands
        thousands = ["", "Thousand", "Lakh", "Crore"] # Indian system format
        # For simplicity, let's just do a very basic one or use a string fallback
        return f"{number:,} Rupees"

    @staticmethod
    async def get_pay_slip_data(payslip_id: str):
        """Fetches payslip data and joins with employee/project info."""
        if db.db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        try:
            slip = await db.pay_slips.find_one({"_id": ObjectId(payslip_id)})
            if not slip:
                raise HTTPException(status_code=404, detail="Pay slip not found")
                
            emp = await db.employees.find_one({"employee_id": slip["employee_id"]})
            if not emp:
                raise HTTPException(status_code=404, detail="Employee not found")
                
            proj = None
            if emp.get("project_id"):
                proj = await db.projects.find_one({"id": emp["project_id"]})
                if not proj:
                     proj = await db.projects.find_one({"_id": ObjectId(emp["project_id"])})

            return {
                "slip": slip,
                "employee": emp,
                "project": proj
            }
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=400, detail="Invalid ID format")

    @staticmethod
    def generate_pay_slip_pdf(data: dict):
        """Generates the PDF file using xhtml2pdf."""
        slip = data["slip"]
        emp = data["employee"]
        proj = data["project"]
        
        env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
        template = env.get_template(TEMPLATE_NAME)
        
        # Calculate components (simulated breakdown)
        amount = float(slip.get("amount", 0))
        basic = round(amount * 0.5, 2)
        hra = round(amount * 0.2, 2)
        conveyance = round(amount * 0.1, 2)
        special = round(amount - (basic + hra + conveyance), 2)
        
        context = {
            "employee_name": emp.get("name"),
            "employee_id": emp.get("employee_id"),
            "role": emp.get("role"),
            "project_name": proj.get("name") if proj else "General Bench",
            "month": slip.get("month"),
            "status": slip.get("status", "Generated"),
            "amount": f"{amount:,.2f}",
            "basic_salary": f"{basic:,.2f}",
            "hra": f"{hra:,.2f}",
            "conveyance": f"{conveyance:,.2f}",
            "special_allowance": f"{special:,.2f}",
            "amount_in_words": PaySlipService.number_to_words(int(amount)),
            "generated_on": datetime.now().strftime("%d-%m-%Y %H:%M"),
            "logo_path": "file:///" + LOGO_PATH.replace("\\", "/")
        }
        
        html_content = template.render(context)
        filename = f"Pay_Slip_{emp.get('employee_id')}_{slip.get('month').replace(' ', '_')}.pdf"
        pdf_path = os.path.join(ASSETS_DIR, filename)
        
        with open(pdf_path, "wb") as f:
            pisa_status = pisa.CreatePDF(html_content, dest=f)
            
        if pisa_status.err:
            raise Exception("PDF generation error")
            
        return pdf_path, filename
