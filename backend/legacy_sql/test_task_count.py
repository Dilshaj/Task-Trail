from app.db.database import engine
from sqlalchemy import func
from sqlalchemy.orm import sessionmaker
from app.models.models import Task
import time

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("Testing raw task count query...")
start = time.time()
try:
    count = db.query(func.count(Task.id)).scalar()
    print(f"Task Count: {count}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
print(f"Time taken: {time.time() - start:.2f}s")
