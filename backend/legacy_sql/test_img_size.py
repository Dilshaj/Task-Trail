from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    res = con.execute(text("SELECT name, DATALENGTH(image) FROM projects")).fetchall()
    print(f"Project Image Sizes: {res}")
