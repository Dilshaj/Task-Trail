import asyncio
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
load_dotenv()

from app.db.mongo import db

async def main():
    db.connect()
    # List all collections to be sure
    print("Connected to MongoDB")
    cursor = db.employees.find({"role": {"$regex": "lead", "$options": "i"}})
    leads = await cursor.to_list(length=100)
    print(f"Found {len(leads)} team leads:")
    for lead in leads:
        print("\n--- TEAM LEAD ---")
        for k, v in lead.items():
            if k not in ['password_hash', 'password']:
                print(f"  '{k}': {v}")
    
    # Also look at all roles just in case role is case-sensitive or different
    cursor2 = db.employees.find({})
    all_emps = await cursor2.to_list(length=200)
    roles = set(emp.get('role') for emp in all_emps)
    print(f"\nAll roles in DB: {roles}")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
