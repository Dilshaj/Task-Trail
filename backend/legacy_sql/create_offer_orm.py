import os
import sys
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.models import OfferLetter

db = SessionLocal()
try:
    ol = OfferLetter(
        employee_id="2026999",
        name="Developer",
        role="Frontend Engineer",
        joining_date="April 10, 2026",
        location="Remote",
        package="10.0 LPA",
        project_id="P1"
    )
    db.add(ol)
    db.commit()
    print("Offer letter successfully created using SQLAlchemy!")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
