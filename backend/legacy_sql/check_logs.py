from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    res = con.execute(text("SELECT * FROM attendance")).fetchall()
    print(f"Total logs: {len(res)}")
    for r in res:
        print(r)
