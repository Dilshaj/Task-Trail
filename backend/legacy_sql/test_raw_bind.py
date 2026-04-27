from app.db.database import engine
from sqlalchemy import text
import time

project_id = "945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e"

with engine.connect() as con:
    print(f"Testing RAW query with BIND parameter: {project_id}...")
    start = time.time()
    try:
        res = con.execute(text("SELECT * FROM projects WHERE id = :pid"), {"pid": project_id}).fetchone()
        print(f"Result: {res[1] if res else 'None'}")
    except Exception as e:
        print(f"Error: {e}")
    print(f"Time taken: {time.time() - start:.2f}s")
