from app.db.database import engine
from sqlalchemy.orm import sessionmaker
from app.models.models import User, Project

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("Listing all users and their projects:")
try:
    users = db.query(User).all()
    for u in users:
        print(f"UID: {u.id}, Name: {u.name}, EID: {u.employee_id}, Role: {u.role}, ProjectID: {u.project_id}")
    
    projects = db.query(Project).all()
    for p in projects:
        print(f"Project ID: {p.id}, Name: {p.name}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
