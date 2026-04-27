import os
import sys

# Ensure app is in path
sys.path.append(os.getcwd())

from app.db.database import engine
from sqlalchemy import text

print("Starting DB check...")
try:
    with engine.connect() as connection:
        sql = text("SELECT TOP 5 * FROM attendance ORDER BY created_at DESC")
        result = connection.execute(sql)
        rows = result.fetchall()
        print(f"Found {len(rows)} rows.")
        for row in rows:
            print(row)
except Exception as e:
    print(f"Error: {e}")
