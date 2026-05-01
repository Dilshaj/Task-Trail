import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

from app.db.database import engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Project
import time

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

project_id = "945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e"

print(f"Testing SQL logging for project fetch...")
start = time.time()
try:
    project = db.query(Project).filter(Project.id == project_id).first()
    print(f"Project Found: {project.name if project else 'None'}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
print(f"Time taken: {time.time() - start:.2f}s")
