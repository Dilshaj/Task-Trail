import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def inspect():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print(f"--- ATTENDANCE LOGS ({db_name}) ---")
    logs = await db.Attendance.find().sort("date", -1).to_list(10)
    for l in logs:
        print(f"Employee: {l.get('employee_id')}, Date: {l.get('date')}, Check-in: {l.get('check_in')}")

    print("\n--- EMPLOYEES ---")
    emps = await db.Employees.find().to_list(10)
    for e in emps:
        print(f"ID: {e.get('employee_id')}, Name: {e.get('name')}, Project: {e.get('project_id')}")

if __name__ == "__main__":
    asyncio.run(inspect())
