from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    res = con.execute(text("SELECT name FROM sys.tables")).fetchall()
    print(f"Tables: {res}")
