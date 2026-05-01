import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.database import SessionLocal
from app.models.models import User

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"Found {len(users)} users:")
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
