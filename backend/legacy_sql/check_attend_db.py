from app.db.database import SessionLocal
from app.models.models import Attendance
from sqlalchemy import text

db = SessionLocal()
try:
    sql = "SELECT TOP 5 * FROM attendance ORDER BY created_at DESC"
    rows = db.execute(text(sql)).fetchall()
    print("Raw Database Rows:")
    for row in rows:
        print(row)
finally:
    db.close()
