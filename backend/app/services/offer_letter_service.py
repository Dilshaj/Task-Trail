import os
import io
from datetime import datetime
from app.db.mongo import db
from app.schemas.schemas import OfferLetterCreate
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LOGO_PATH = os.path.join(BACKEND_ROOT, "static", "logos", "company_logo.jpg")


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
            pids = [str(project_id)]
            try: pids.append(ObjectId(project_id))
            except: pass
            query["project_id"] = {"$in": pids}
        else:
            query["project_id"] = {"$in": [None, "", "null", "undefined"]}
        
        cursor = db.offers.find(query).sort("updated_at", -1).skip(skip).limit(limit)
        raw_offers = await cursor.to_list(length=limit)
        return [OfferLetterService.format_offer_letter(o) for o in raw_offers]

    @staticmethod
    def generate_offer_letter_pdf(offer_data: dict) -> io.BytesIO:
        """
        Generates a professional 4-page offer letter PDF using pure Python (reportlab).
        Returns a BytesIO buffer — no filesystem writes, works on any deployment server.
        """
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
            Table, TableStyle, Image, PageBreak
        )
        from reportlab.platypus.frames import Frame
        from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate

        # ── Data mapping ───────────────────────────────────────────────────────────
        current_date_obj = datetime.now()
        candidate_name = offer_data.get("name") or "Unknown Candidate"
        job_title = offer_data.get("role") or "Employee"
        joining_date = offer_data.get("joining_date") or current_date_obj.strftime("%B %d, %Y")
        work_location = offer_data.get("location") or "Rolugunta[Visakhapatnam]"
        raw_package = str(offer_data.get("package") or "0").replace(",", "").replace("Rs.", "").strip()
        try:
            ctc_formatted = f"Rs. {int(float(raw_package)):,}"
        except Exception:
            ctc_formatted = raw_package
        offer_date = current_date_obj.strftime("%B %d, %Y")
        employee_id = offer_data.get("employee_id", "")

        # ── Colors ─────────────────────────────────────────────────────────────────
        BRAND_DARK = colors.HexColor("#0D1F3C")
        BRAND_MID = colors.HexColor("#1A3A6E")
        BODY_TEXT = colors.HexColor("#1A1A1A")
        RULE_COLOR = colors.HexColor("#1A3A6E")

        # ── PDF setup ──────────────────────────────────────────────────────────────
        buffer = io.BytesIO()
        page_w, page_h = A4
        left_m = 20 * mm
        right_m = 20 * mm
        top_m = 18 * mm
        bot_m = 18 * mm
        content_w = page_w - left_m - right_m

        # ── Style helpers ──────────────────────────────────────────────────────────
        styles = getSampleStyleSheet()

        def make_style(name, parent="Normal", **kwargs):
            base = styles.get(parent, styles["Normal"])
            s = ParagraphStyle(name=name, parent=base, **kwargs)
            return s

        title_style = make_style("OfferTitle", fontSize=16, textColor=BRAND_DARK,
                                  alignment=TA_CENTER, fontName="Helvetica-Bold",
                                  spaceAfter=6)
        date_style = make_style("OfferDate", fontSize=11, textColor=BODY_TEXT,
                                 fontName="Helvetica", spaceAfter=4)
        to_style = make_style("ToLine", fontSize=11, textColor=BODY_TEXT,
                               fontName="Helvetica", spaceAfter=2)
        name_style = make_style("CandName", fontSize=13, textColor=BRAND_DARK,
                                 fontName="Helvetica-Bold", spaceAfter=2)
        addr_style = make_style("Addr", fontSize=11, textColor=BODY_TEXT,
                                 fontName="Helvetica", spaceAfter=8)
        dear_style = make_style("Dear", fontSize=12, textColor=BODY_TEXT,
                                 fontName="Helvetica-Bold", spaceAfter=4)
        body_style = make_style("OfferBody", fontSize=11, textColor=BODY_TEXT,
                                 fontName="Helvetica", leading=16,
                                 alignment=TA_JUSTIFY, spaceAfter=8)
        section_hdr = make_style("SectionHdr", fontSize=13, textColor=BRAND_MID,
                                  fontName="Helvetica-Bold", spaceAfter=6, spaceBefore=8)
        sub_hdr = make_style("SubHdr", fontSize=11, textColor=BODY_TEXT,
                               fontName="Helvetica-Bold", spaceAfter=4, spaceBefore=4)
        label_style = make_style("LabelStyle", fontSize=11, textColor=BODY_TEXT,
                                  fontName="Helvetica-Bold")
        value_style = make_style("ValueStyle", fontSize=11, textColor=BODY_TEXT,
                                  fontName="Helvetica")
        sign_style = make_style("SignStyle", fontSize=11, textColor=BODY_TEXT,
                                 fontName="Helvetica", spaceAfter=2)
        sign_bold_style = make_style("SignBoldStyle", fontSize=11, textColor=BODY_TEXT,
                                      fontName="Helvetica-Bold", spaceAfter=2)

        # ── Build document content ─────────────────────────────────────────────────
        story = []

        def add_logo():
            """Add company logo if available."""
            if os.path.exists(LOGO_PATH):
                try:
                    img = Image(LOGO_PATH, width=40 * mm, height=14 * mm)
                    img.hAlign = "LEFT"
                    story.append(img)
                    story.append(Spacer(1, 3 * mm))
                except Exception:
                    pass

        def add_header_rule():
            story.append(HRFlowable(width="100%", thickness=1.5,
                                     color=RULE_COLOR, spaceAfter=6))

        def add_footer_rule():
            story.append(Spacer(1, 4 * mm))
            story.append(HRFlowable(width="100%", thickness=0.5,
                                     color=RULE_COLOR, spaceAfter=3))
            story.append(Paragraph(
                "<font color='#1A3A6E' size='8'>Dilshaj Infotech • Ainada, Visakhapatnam, Andhrapradesh 535005 • dilshajceo@dilshajinfotech.tech</font>",
                make_style("Footer", fontSize=8, alignment=TA_CENTER, fontName="Helvetica")))

        def detail_row(label, value):
            """Creates a two-cell table row for key-value details."""
            return Table(
                [[Paragraph(label, label_style), Paragraph(value, value_style)]],
                colWidths=[50 * mm, content_w - 50 * mm],
                style=TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ])
            )

        # ── PAGE 1: Offer Details & Basic Terms ───────────────────────────────────
        add_logo()
        add_header_rule()
        story.append(Paragraph("OFFER LETTER", title_style))
        story.append(Spacer(1, 2 * mm))
        story.append(Paragraph(f"Date: {offer_date}", date_style))
        story.append(Paragraph("To,", to_style))
        story.append(Paragraph(candidate_name, name_style))
        story.append(Paragraph("Ainada, Visakhapatnam, Andhrapradesh 535005.", addr_style))
        story.append(Spacer(1, 2 * mm))
        story.append(Paragraph(f"Dear {candidate_name.split()[0]},", dear_style))

        story.append(Paragraph(
            "We are delighted to offer you the position of Junior Developer at Dilshaj Infotech. "
            "We believe your skills and passion align perfectly with our vision of empowering "
            "intelligence and building innovative solutions for the future.",
            body_style
        ))

        story.append(Paragraph("1. Position Details", section_hdr))
        details = [
            ("Position:", job_title),
            ("Department:", "Development"),
            ("Reporting To:", "Manager"),
            ("Employment Type:", "Full-Time"),
            ("Date of Joining:", joining_date),
            ("Work Location:", work_location),
        ]
        for lbl, val in details:
            story.append(detail_row(lbl, val))
        story.append(Spacer(1, 3 * mm))

        story.append(Paragraph("2. Compensation and Benefits", section_hdr))
        story.append(Paragraph(
            f"<b>Total CTC:</b> {ctc_formatted} per annum.", body_style
        ))
        story.append(Paragraph(
            "<b>Probation Period:</b> 3 months (performance-based confirmation). "
            "During probation, either party may terminate employment with 15 days written notice/digital notice. "
            "Upon successful completion, you will be confirmed as a regular employee. "
            "Additional benefits such as performance bonuses, leaves, and incentives may be applicable "
            "as per company policy.",
            body_style
        ))

        story.append(Paragraph("3. Working Hours", section_hdr))
        story.append(Paragraph(
            "Standard working hours are 9:00 AM to 5:00 PM, Monday to Friday. "
            "Employees are expected to adhere to punctuality and attendance norms. "
            "Work-from-home or flexible hours may be allowed at management discretion.",
            body_style
        ))
        add_footer_rule()

        # ── PAGE 2: Authority, Assignments, Facts ─────────────────────────────────
        story.append(PageBreak())
        add_logo()
        add_header_rule()

        story.append(Paragraph(
            "<b>Authority:</b> You will not enter into any contracts, commitments or dealings on behalf "
            "of the Company for which you have no express authority nor alter or be a party to any "
            "alteration of any principle or policy of the Company or exceed the authority or discretion "
            "vested in you without the previous sanction of the Company.",
            body_style
        ))
        story.append(Paragraph(
            "<b>Assignments / Transfer / Deputation:</b> Though you have been engaged for a specific "
            "position, the Company reserves the right to send you on training/deputation/secondment/"
            "transfer/assignments to any other locations, departments or units of the Company or its "
            "associate companies, subsidiaries, group companies or customer locations, whether in India "
            "or abroad. In such case, the terms and conditions of service applicable to the new assignment "
            "will govern you.",
            body_style
        ))
        story.append(Paragraph(
            "You shall, only at the request of the Company, enter into a direct agreement or undertaking "
            "with any customer to whom you may be assigned/seconded/deputed accepting restrictions which "
            "the customer may reasonably require for the protection of its legitimate interests.",
            body_style
        ))
        story.append(Paragraph(
            "You are an employee of the Company and are not and shall not become the employee or agent "
            "of any customer at whose premises you may be deployed, at any time during your services with "
            "the Company. The Company shall be responsible for the payment of all your compensation, "
            "benefits and insurance as applicable and you shall not be entitled to claim any customer "
            "employee benefits. You acknowledge that you are not an employee of the customer for any "
            "purpose and shall not exercise any rights or seek any benefit accruing to the regular "
            "employees of the customer.",
            body_style
        ))
        story.append(Paragraph(
            "<b>Statement of Facts:</b> It must be specifically understood that this offer is made based "
            "on your proficiency on technical/professional skills you have declared to possess as per the "
            "application, and on the ability to handle any assignment / job independently anywhere in India "
            "or overseas. In case, at a later date, any of your statements/particulars furnished are found "
            "to be false or misleading, or your performance is not up to the mark, the Company shall have "
            "the right to terminate your services at its own discretion without notice or compensation in "
            "lieu thereof. Further, your appointment is contingent upon satisfactory reference and background "
            "checks which may be conducted at any time from the date of this Offer Letter to 90 (ninety) "
            "days of your joining date.",
            body_style
        ))
        add_footer_rule()

        # ── PAGE 3: Company Policies & General Terms ──────────────────────────────
        story.append(PageBreak())
        add_logo()
        add_header_rule()

        story.append(Paragraph("4. Company Policies", section_hdr))

        story.append(Paragraph("4.1 Code of Conduct", sub_hdr))
        story.append(Paragraph(
            "You are expected to: Maintain professionalism and respect in the workplace. "
            "Protect company assets, data, and intellectual property. "
            "Avoid conflicts of interest and unauthorized disclosures.",
            body_style
        ))

        story.append(Paragraph("4.2 Confidentiality", sub_hdr))
        story.append(Paragraph(
            "All information related to company operations, clients, or technology must remain "
            "confidential. Any violation will result in disciplinary action or termination.",
            body_style
        ))

        story.append(Paragraph("4.3 Probation and Termination", sub_hdr))
        story.append(Paragraph(
            "During probation, either party can terminate employment with 15 days written notice/"
            "digital Notice. Post-confirmation, the notice period will be 30 days. "
            "The company reserves the right to terminate employment for misconduct or policy violation.",
            body_style
        ))

        story.append(Paragraph("4.4 Data and System Policy", sub_hdr))
        story.append(Paragraph(
            "All employees must follow cybersecurity and data protection guidelines. "
            "Use of company systems for personal or illegal activities is strictly prohibited.",
            body_style
        ))

        story.append(Paragraph("4.5 Anti-Harassment Policy", sub_hdr))
        story.append(Paragraph(
            "Dilshaj Infotech promotes a safe and inclusive work culture. "
            "Harassment or discrimination of any kind will not be tolerated.",
            body_style
        ))

        story.append(Paragraph("4.6 Intellectual Property", sub_hdr))
        story.append(Paragraph(
            "Any work, code, or innovation developed during your employment remains the property "
            "of Dilshaj Infotech.",
            body_style
        ))

        story.append(Paragraph("5. General Terms", section_hdr))
        story.append(Paragraph(
            "This offer is contingent upon verification of your documents and references. "
            "You agree to abide by all company rules, policies, and amendments made from time to time. "
            "Failure to comply with company policies may result in disciplinary action or termination.",
            body_style
        ))
        story.append(Paragraph(
            "<b>Work Performance:</b> The Company will expect you to work with a high standard of "
            "initiative and productivity. In view of your position, you are expected to perform "
            "efficiently to ensure quality results, which sometimes may require extra hours of effort. "
            "In addition, you may be required to work in shifts, including night shifts, depending upon "
            "the organizational needs.",
            body_style
        ))
        add_footer_rule()

        # ── PAGE 4: Acceptance & Signatures ───────────────────────────────────────
        story.append(PageBreak())
        add_logo()
        add_header_rule()

        story.append(Paragraph("6. Acceptance", section_hdr))
        story.append(Paragraph(
            f"Please sign and return a scanned copy of this letter by {joining_date} to confirm your "
            "acceptance of the offer and the terms outlined herein.",
            body_style
        ))
        story.append(Paragraph(
            "We are excited to welcome you to Dilshaj Infotech and look forward to your valuable "
            "contributions toward our mission of empowering intelligence and building the future.",
            body_style
        ))
        story.append(Spacer(1, 10 * mm))
        story.append(Paragraph("Warm regards,", sign_style))
        story.append(Paragraph("For Dilshaj Infotech", sign_style))
        story.append(Spacer(1, 12 * mm))
        story.append(HRFlowable(width=60 * mm, thickness=0.5,
                                  color=BODY_TEXT, hAlign="LEFT", spaceAfter=4))
        story.append(Paragraph("Dilshaj Shaik", sign_bold_style))
        story.append(Paragraph("CEO, Dilshaj Infotech", sign_style))
        story.append(Paragraph("Email: dilshajceo@dilshajinfotech.tech", sign_style))
        story.append(Paragraph("recruitmentcell@dilshajinfotech.tech", sign_style))
        story.append(Paragraph("Phone: +91-8977272783", sign_style))
        story.append(Spacer(1, 10 * mm))
        story.append(Paragraph(f"Accepted by: {candidate_name}", sign_style))
        story.append(Spacer(1, 12 * mm))
        story.append(HRFlowable(width=60 * mm, thickness=0.5,
                                  color=BODY_TEXT, hAlign="LEFT", spaceAfter=4))
        story.append(Paragraph("Date: ____________________", sign_style))
        add_footer_rule()

        # ── Build PDF ──────────────────────────────────────────────────────────────
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=left_m,
            rightMargin=right_m,
            topMargin=top_m,
            bottomMargin=bot_m,
        )
        doc.build(story)
        buffer.seek(0)
        return buffer
