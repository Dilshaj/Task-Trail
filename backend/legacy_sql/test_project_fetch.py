from app.db.database import engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Project
import time

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

project_id = "945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e"

print(f"Testing project fetch for project_id: {project_id}")
start = time.time()
try:
    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        print(f"Project Found: {project.name}")
    else:
        print("Project NOT found.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
print(f"Time taken: {time.time() - start:.2f}s")
