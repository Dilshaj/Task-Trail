import sys
import os
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.services.auth_service import authenticate_user

db = SessionLocal()
try:
    user = authenticate_user(db, email="dilshajceo@dilshajinfotech.tech", password="admin@123")
    if user:
        print("Authenticated successfully!", user.email, user.role)
    else:
        print("Authentication failed!")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
