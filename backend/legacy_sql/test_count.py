from app.db.database import engine
from sqlalchemy import func
from sqlalchemy.orm import sessionmaker
from app.models.models import Project

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("Testing raw count query...")
try:
    count = db.query(func.count(Project.id)).scalar()
    print(f"Project Count: {count}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
