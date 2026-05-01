import os
import sys

# Ensure app is in path
sys.path.append(os.getcwd())

from app.db.database import engine
from sqlalchemy import text

print("Starting DB check for today...")
try:
    with engine.connect() as connection:
        sql = text("SELECT * FROM attendance WHERE date = '2026-04-23'")
        result = connection.execute(sql)
        rows = result.fetchall()
        print(f"Found {len(rows)} rows for today.")
        for row in rows:
            print(f"ID: {row[0]}, Date: {row[2]}, CheckIn: {row[3]} ({type(row[3])}), CheckOut: {row[4]} ({type(row[4])})")
except Exception as e:
    print(f"Error: {e}")
