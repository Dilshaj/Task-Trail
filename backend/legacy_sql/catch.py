import sys
import os
sys.path.append(os.getcwd())
try:
    from app.db.database import SessionLocal
    from app.models.models import User
    db = SessionLocal()
    db.query(User).first()
except Exception as e:
    import traceback
    with open('real_err.log', 'w') as f:
        f.write(traceback.format_exc())
