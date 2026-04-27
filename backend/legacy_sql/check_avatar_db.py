from app.db.database import SessionLocal, engine
from app.models.models import User
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_and_test():
    db = SessionLocal()
    try:
        # 1. Check existing column names
        logger.info("Checking database schema for employees_table...")
        res = db.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'employees_table'")).fetchall()
        columns = [r[0] for r in res]
        logger.info(f"Available columns: {columns}")
        
        # 2. Try identifying Kiran
        kiran = db.query(User).filter(User.employee_id == '2026005').first()
        if kiran:
            logger.info(f"Kiran found. UUID: {kiran.id}. Current Avatar: {kiran.avatar}")
            
            # 3. Try manual update
            test_url = "https://res.cloudinary.com/dv1sih7vk/image/upload/v1741346387/sample.jpg"
            logger.info(f"Attempting manual update to: {test_url}")
            kiran.avatar = test_url
            db.commit()
            db.refresh(kiran)
            logger.info(f"Verification after commit FOR KIRAN: {kiran.avatar}")
        else:
            logger.warning("Kiran (2026005) not found in DB.")
            
    except Exception as e:
        logger.error(f"DB Test Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    check_and_test()
