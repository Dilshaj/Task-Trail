from app.db.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    res = conn.execute(text("SELECT id, name, employee_id FROM employees_table"))
    for row in res:
        print(f"ID: {row[0]}, NAME: {row[1]}, EID: {row[2]}")
