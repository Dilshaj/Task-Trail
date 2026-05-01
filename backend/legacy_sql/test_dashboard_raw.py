from app.db.database import engine
from sqlalchemy import text
import time

with engine.connect() as con:
    print("Testing RAW dashboard query (combined)...")
    start = time.time()
    try:
        res = con.execute(text("""
            SELECT 
                (SELECT COUNT(*) FROM projects) as activeProjects,
                (SELECT COUNT(*) FROM employees_table WHERE user_role = 'user') as activeEmployees,
                (SELECT COUNT(*) FROM tasks) as totalTasks,
                (SELECT COUNT(*) FROM tasks WHERE status = 'Completed') as completedTasks
        """)).fetchone()
        print(f"Metrics: {res}")
    except Exception as e:
        print(f"Error: {e}")
    print(f"Time taken: {time.time() - start:.2f}s")
