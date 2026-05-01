from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    res = con.execute(text("SELECT id, name, employee_id FROM employees_table")).fetchall()
    for r in res:
        print(f"ID: {r[0]}, Name: {r[1]}, EID: {r[2]}")
