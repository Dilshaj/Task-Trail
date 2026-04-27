from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    try:
        res = con.execute(text("SELECT TOP 1 * FROM users")).fetchall()
        print(f"Users table exists. Data: {res}")
    except Exception as e:
        print(f"Users table might not exist or error: {e}")
