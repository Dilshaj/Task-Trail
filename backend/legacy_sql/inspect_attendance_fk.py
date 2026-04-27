from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    sql = """
    SELECT k.name, t.name, c.name, rt.name, rc.name
    FROM sys.foreign_keys k
    JOIN sys.tables t ON t.object_id = k.parent_object_id
    JOIN sys.foreign_key_columns kf ON kf.constraint_object_id = k.object_id
    JOIN sys.columns c ON c.column_id = kf.parent_column_id AND c.object_id = t.object_id
    JOIN sys.tables rt ON rt.object_id = k.referenced_object_id
    JOIN sys.columns rc ON rc.column_id = kf.referenced_column_id AND rc.object_id = rt.object_id
    WHERE t.name = 'attendance'
    """
    res = con.execute(text(sql)).fetchall()
    for row in res:
        print(row)
