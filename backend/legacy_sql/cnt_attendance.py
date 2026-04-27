from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    cnt = con.execute(text("SELECT COUNT(*) FROM attendance")).scalar()
    print(f"Attendance count: {cnt}")
