from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    try:
        # Move employees from 'p1' (dummy ID) to actual 'EduProva' ID
        con.execute(text("UPDATE employees_table SET project_id = '945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e' WHERE project_id = 'p1'"))
        con.commit()
        print("Migrated employees from p1 to EduProva.")
    except Exception as e:
        print(f"Error: {e}")
