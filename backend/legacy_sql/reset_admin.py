import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.models import User
from app.utils.security import get_password_hash

db = SessionLocal()
try:
    admin_email = "dilshajceo@dilshajinfotech.tech"
    admin = db.query(User).filter(User.email == admin_email).first()
    if admin:
        print(f"Found admin {admin.name}, resetting password to 'admin@123'")
        admin.password_hash = get_password_hash("admin@123")
        db.commit()
        print("Password reset successful.")
    else:
        print("Admin user not found.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
