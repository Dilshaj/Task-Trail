from app.db.database import engine
from sqlalchemy.orm import sessionmaker
from app.models.models import User
db = sessionmaker(bind=engine)()
u = db.query(User).filter(User.name == "murali").first()
if u:
    print(f"MURALI_ID: {u.id}")
else:
    print("MURALI NOT FOUND")
db.close()
