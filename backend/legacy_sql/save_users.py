from app.db.database import engine
from sqlalchemy.orm import sessionmaker
from app.models.models import User
import json

db = sessionmaker(bind=engine)()
users = [{"id": u.id, "name": u.name, "eid": u.employee_id} for u in db.query(User).all()]
db.close()
with open('users_with_ids.json', 'w') as f:
    json.dump(users, f, indent=2)
