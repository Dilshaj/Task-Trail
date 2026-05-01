from app.db.database import engine
from sqlalchemy import text
import time

project_id = "945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e"

with engine.connect() as con:
    print(f"Testing RAW dashboard query WITH LITERAL project_id: {project_id}...")
    start = time.time()
    try:
        res = con.execute(text(f"""
            SELECT 
                1 as active_projects,
                (SELECT COUNT(*) FROM employees_table WHERE user_role = 'user' AND project_id = '{project_id}') as active_employees,
                (SELECT COUNT(*) FROM tasks WHERE project_id = '{project_id}') as total_tasks,
                (SELECT COUNT(*) FROM tasks WHERE status = 'Completed' AND project_id = '{project_id}') as completed_tasks
        """)).fetchone()
        print(f"Metrics: {res}")
    except Exception as e:
        print(f"Error: {e}")
    print(f"Time taken: {time.time() - start:.2f}s")
