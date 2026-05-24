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
    emps = await cursor.to_list(length=200)
    print(f"Total employees: {len(emps)}")
    for emp in emps:
        role = emp.get('role', '')
        name = emp.get('name', '')
        employee_id = emp.get('employee_id', '')
        # print if it looks like a team lead or has python
        if 'lead' in str(role).lower() or 'lead' in str(name).lower() or 'python' in str(role).lower() or 'python' in str(name).lower():
            print(f"ID: {employee_id} | Name: {name} | Role: {role} | Email: {emp.get('email')} | Project ID: {emp.get('project_id')}")
            
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
