from app.db.database import engine
from sqlalchemy import text
with engine.connect() as con:
    tables = ['attendance', 'leave_requests', 'offer_letters']
    for t in tables:
        try:
            cnt = con.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
            if cnt == 0:
                print(f"Dropping empty table {t} to clear stale schemas...")
                con.execute(text(f"DROP TABLE {t}"))
            else:
                print(f"Table {t} has {cnt} records, skipping drop.")
        except Exception as e:
            print(f"Error checking/dropping {t}: {e}")
    con.commit()
