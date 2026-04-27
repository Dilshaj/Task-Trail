import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.services.auth_service import authenticate_user

db = SessionLocal()
try:
    email = "dilshajceo@dilshajinfotech.tech"
    password = "admin@123"
    print(f"Testing login for: {email} / {password}")
    
    user = authenticate_user(db, email=email, password=password)
    if user:
        print(f"✅ Login SUCCESSFUL! User ID: {user.id}, Role: {user.role}")
    else:
        print("❌ Login FAILED (authenticate_user returned False)")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
