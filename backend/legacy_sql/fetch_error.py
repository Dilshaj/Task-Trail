import sys
import os
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.models import User
db = SessionLocal()
try:
    admin_user = db.query(User).filter(User.role == "admin").first()
except Exception as e:
    with open("error.txt", "w") as f:
        f.write(str(e))
