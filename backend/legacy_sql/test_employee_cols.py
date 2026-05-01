from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    res = con.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'employees_table'"))
    print([r[0] for r in res])
