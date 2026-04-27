from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    sql = """
    SELECT 
        obj.name AS FK_NAME,
        sch.name AS SCHEMA_NAME,
        tab1.name AS TABLE_NAME,
        col1.name AS COLUMN_NAME,
        tab2.name AS REFERENCED_TABLE_NAME,
        col2.name AS REFERENCED_COLUMN_NAME
    FROM sys.foreign_key_columns fkc
    INNER JOIN sys.objects obj ON obj.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables tab1 ON tab1.object_id = fkc.parent_object_id
    INNER JOIN sys.schemas sch ON sch.schema_id = tab1.schema_id
    INNER JOIN sys.columns col1 ON col1.column_id = fkc.parent_column_id AND col1.object_id = fkc.parent_object_id
    INNER JOIN sys.tables tab2 ON tab2.object_id = fkc.referenced_object_id
    INNER JOIN sys.columns col2 ON col2.column_id = fkc.referenced_column_id AND col2.object_id = fkc.referenced_object_id
    WHERE tab1.name = 'tasks'
    """
    res = con.execute(text(sql)).fetchall()
    for r in res:
        print(r)
