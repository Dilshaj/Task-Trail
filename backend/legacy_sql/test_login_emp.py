import sys
import os
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.services.auth_service import authenticate_user

db = SessionLocal()
try:
    user = authenticate_user(db, employee_id="EMP001", password="user")
    if user:
        print("Authenticated successfully!", user.employee_id, user.role)
    else:
        print("Authentication failed!")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
