from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    try:
        # Find all FKs for 'tasks'
        sql_find = """
        SELECT name FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('tasks')
        """
        fks = con.execute(text(sql_find)).fetchall()
        for fk in fks:
            fk_name = fk[0]
            print(f"Dropping FK: {fk_name}")
            con.execute(text(f"ALTER TABLE tasks DROP CONSTRAINT {fk_name}"))
        
        # Also check 'project_id' FK if exists
        con.commit()
        print("Dropped all tasks FKs.")
    except Exception as e:
        print(f"Error dropping FKs: {e}")
