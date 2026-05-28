import asyncio
import os
from dotenv import load_dotenv
import motor.motor_asyncio

load_dotenv(dotenv_path="backend/.env")

async def main():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("--- Searching for users in Employees ---")
    cursor = db.Employees.find({"employee_id": {"$in": ["2026005", 2026005, "20260005", 20260005]}})
    async for emp in cursor:
        print(f"Name: {emp.get('name')}, employee_id: {emp.get('employee_id')}, is_checked_in: {emp.get('is_checked_in')}")

    print("\n--- Searching in Attendance logs ---")
    cursor = db.Attendance.find({"employee_id": {"$in": ["2026005", 2026005, "20260005", 20260005]}})
    async for att in cursor:
        print(f"EID: {att.get('employee_id')}, Date: {att.get('date')}, check_out: {att.get('check_out')}")

if __name__ == "__main__":
    asyncio.run(main())
