import os
import sys

# Ensure app is in path
sys.path.append(os.getcwd())

from app.db.database import engine
from sqlalchemy import text

print("Starting DB fix for invalid ISO timestamps...")
try:
    with engine.connect() as connection:
        # Fix check_in
        sql_in = text("UPDATE attendance SET check_in = REPLACE(check_in, '+00:00Z', 'Z') WHERE check_in LIKE '%+00:00Z'")
        res_in = connection.execute(sql_in)
        
        # Fix check_out
        sql_out = text("UPDATE attendance SET check_out = REPLACE(check_out, '+00:00Z', 'Z') WHERE check_out LIKE '%+00:00Z'")
        res_out = connection.execute(sql_out)
        
        connection.commit()
        print(f"Fixed check_in counts: {res_in.rowcount}")
        print(f"Fixed check_out counts: {res_out.rowcount}")
except Exception as e:
    print(f"Error: {e}")
