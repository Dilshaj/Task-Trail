from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    try:
        # Find all FKs for any table that refer to projects or users
        # but for now focus on 'tasks'
        sql_find = """
        SELECT k.name AS FK_NAME, t.name AS TABLE_NAME
        FROM sys.foreign_keys k
        JOIN sys.tables t ON t.object_id = k.parent_object_id
        WHERE t.name = 'tasks'
        """
        fks = con.execute(text(sql_find)).fetchall()
        for fk in fks:
            fk_name = fk[0]
            tb_name = fk[1]
            print(f"Dropping FK: {fk_name} on {tb_name}")
            con.execute(text(f"ALTER TABLE {tb_name} DROP CONSTRAINT {fk_name}"))
        
        con.commit()
        print("Dropped all tasks FKs.")
    except Exception as e:
        print(f"Error: {e}")
