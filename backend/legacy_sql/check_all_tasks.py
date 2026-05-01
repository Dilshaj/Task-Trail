from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    res = con.execute(text("SELECT * FROM tasks")).fetchall()
    print(f"Total tasks: {len(res)}")
    for r in res:
        print(f"Task: {r[1]}, AssignedTo: {r[7]}, Project: {r[8]}")
