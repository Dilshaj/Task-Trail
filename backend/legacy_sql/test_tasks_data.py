from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    res = con.execute(text("SELECT TOP 10 * FROM tasks")).fetchall()
    print(f"Tasks: {res}")
