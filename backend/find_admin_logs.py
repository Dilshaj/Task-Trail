import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def find_admin_logs():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("--- SEARCHING FOR ADMIN LOGS ---")
    # Finding by email or employee_id
    logs = await db.Attendance.find().to_list(100)
    for l in logs:
        print(f"ID: {l.get('employee_id')}, Date: {l.get('date')}, Project: {l.get('project_id')}")

if __name__ == "__main__":
    asyncio.run(find_admin_logs())
