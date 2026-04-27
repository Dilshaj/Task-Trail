from app.db.database import engine
from sqlalchemy import func
from sqlalchemy.orm import sessionmaker
from app.models.models import User
import time

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

project_id = "945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e"

print(f"Testing project-filtered user count query for project_id: {project_id}")
start = time.time()
try:
    user_q = db.query(func.count(User.id)).filter(User.role == 'user')
    user_q = user_q.filter(User.project_id == project_id)
    count = user_q.scalar()
    print(f"User Count: {count}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
print(f"Time taken: {time.time() - start:.2f}s")
