from app.db.database import engine
from sqlalchemy import text
import time

with engine.connect() as con:
    print("Testing RAW SELECT 1...")
    start = time.time()
    try:
        res = con.execute(text("SELECT 1")).scalar()
        print(f"Result: {res}")
    except Exception as e:
        print(f"Error: {e}")
    print(f"Time taken: {time.time() - start:.2f}s")
