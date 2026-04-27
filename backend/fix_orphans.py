import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix_orphans():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("--- FIXING ORPHANED ATTENDANCE LOGS ---")
    logs = await db.Attendance.find({"project_id": None}).to_list(1000)
    print(f"Found {len(logs)} logs without a project ID.")
    
    for l in logs:
        emp_id = l.get("employee_id")
        user = await db.Employees.find_one({"employee_id": emp_id})
        if user and user.get("project_id"):
            pid = user.get("project_id")
            await db.Attendance.update_one({"_id": l["_id"]}, {"$set": {"project_id": pid}})
            print(f"Updated log for {emp_id} with project {pid}")
    
    print("DONE")

if __name__ == "__main__":
    asyncio.run(fix_orphans())
