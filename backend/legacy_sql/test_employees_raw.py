from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    try:
        res = con.execute(text("SELECT TOP 5 * FROM employees_table")).fetchall()
        print(f"Top 5 employees: {res}")
    except Exception as e:
        print(f"Error: {e}")
