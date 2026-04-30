import asyncio
import os
import sys

# Add the app directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "app"))
sys.path.append(os.getcwd())

from app.db.mongo import db

async def check():
    db.connect()
    print("--- ATTENDANCE LOGS ---")
    logs = await db.attendance.find().limit(3).to_list(3)
    for l in logs:
        print(f"Log ID: {l.get('_id')}, Emp: {l.get('employee_id')}, Project: {l.get('project_id')}")
    
    print("\n--- EMPLOYEES ---")
    emps = await db.employees.find().limit(3).to_list(3)
    for e in emps:
        print(f"Emp ID: {e.get('employee_id')}, Project: {e.get('project_id')}")

if __name__ == "__main__":
    asyncio.run(check())
