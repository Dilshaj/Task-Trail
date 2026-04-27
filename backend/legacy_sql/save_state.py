from app.db.database import engine
from sqlalchemy.orm import sessionmaker
from app.models.models import User, Project
import json

db = sessionmaker(bind=engine)()
users = [{"name": u.name, "eid": u.employee_id, "pid": u.project_id} for u in db.query(User).all()]
projects = [{"name": p.name, "id": p.id} for p in db.query(Project).all()]
db.close()

with open('state.json', 'w') as f:
    json.dump({"users": users, "projects": projects}, f, indent=2)
