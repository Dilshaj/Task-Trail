import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
load_dotenv()

from app.db.mongo import db

async def main():
    db.connect()
    print("Connected to MongoDB")
    cursor = db.employees.find({})
    emps = await cursor.to_list(length=100)
    for emp in emps:
        # Check if there is a plaintext 'password' field or if the password_hash is not hashed
        pw = emp.get('password')
        pw_hash = emp.get('password_hash')
        name = emp.get('name')
        emp_id = emp.get('employee_id')
        if pw or pw_hash:
            # check if the password field exists and what it contains (truncate/obfuscate for safety but check length and format)
            pw_str = str(pw) if pw else None
            pw_hash_str = str(pw_hash) if pw_hash else None
            print(f"ID: {emp_id} | Name: {name}")
            if pw_str:
                print(f"  'password' field: {pw_str[:5]}... (len: {len(pw_str)})")
            if pw_hash_str:
                print(f"  'password_hash' field: {pw_hash_str[:15]}... (len: {len(pw_hash_str)})")
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
