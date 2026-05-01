from app.db.database import SessionLocal
from app.models.models import OfferLetter
import uuid

def test_insert():
    db = SessionLocal()
    try:
        print("Attempting to insert test offer letter...")
        test_offer = OfferLetter(
            employee_id="TEST-001",
            name="Test User",
            role="Developer",
            joining_date="2025-01-01",
            location="Remote",
            package="5 LPA"
        )
        db.add(test_offer)
        db.commit()
        print("Commit success!")
        db.refresh(test_offer)
        print(f"Created ID: {test_offer.id}")
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_insert()
