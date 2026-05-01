import os
import sys
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.models import OfferLetter

db = SessionLocal()
try:
    ol = OfferLetter(
        employee_id="ADMIN-001",
        name="Administrator",
        role="CEO",
        joining_date="Jan 1, 2026",
        location="HQ",
        package="20.0 LPA",
        project_id="P1"
    )
    db.add(ol)
    db.commit()
    print("Offer letter for ADMIN-001 successfully created!")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
