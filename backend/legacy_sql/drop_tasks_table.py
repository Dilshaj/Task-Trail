from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    try:
        con.execute(text("DROP TABLE tasks"))
        con.commit()
        print("Dropped tasks table.")
    except Exception as e:
        print(f"Error dropping table tasks: {e}")
