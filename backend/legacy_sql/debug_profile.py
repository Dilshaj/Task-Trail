"""
Test profile update endpoint directly to find the exact error.
"""
import sys, os
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.models import User

db = SessionLocal()
try:
    # Check the column size of avatar_url
    from sqlalchemy import inspect, text
    result = db.execute(text("""
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'employees_table' AND COLUMN_NAME = 'avatar_url'
    """)).fetchone()
    print(f"avatar_url column: {result}")
    
    # Check if admin user can be serialized
    admin = db.query(User).filter(User.email == 'dilshajceo@dilshajinfotech.tech').first()
    print(f"Admin: id={admin.id}, avatar={admin.avatar}")
    
    # Check user murali
    murali = db.query(User).filter(User.employee_id == '2026999').first()
    if murali:
        print(f"Murali: id={murali.id}, avatar={murali.avatar[:60] if murali.avatar else None}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
