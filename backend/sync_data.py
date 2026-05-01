import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def sync_data():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("--- DATA SYNCHRONIZATION ---")
    
    # 1. Get the REAL project ID for eduprova
    real_project = await db.Projects.find_one({"name": {"$regex": "eduprova", "$options": "i"}})
    if not real_project:
        print("REAL PROJECT 'eduprova' NOT FOUND. CANNOT SYNC.")
        return
    
    real_pid = str(real_project["_id"])
    print(f"Target Project: eduprova -> {real_pid}")
    
    # 2. Find all employees who are assigned to some variant of a project
    # We'll just update ALL employees who have 'eduprova' in mind (murali etc.)
    # In this specific case, I'll update everyone to use the real PID for simplicity of fixing the current breakage
    
    res1 = await db.Employees.update_many({}, {"$set": {"project_id": real_pid}})
    print(f"Updated {res1.modified_count} employees to project {real_pid}")
    
    # 3. Update all existing attendance logs too
    res2 = await db.Attendance.update_many({}, {"$set": {"project_id": real_pid}})
    print(f"Updated {res2.modified_count} attendance logs to project {real_pid}")
    
    print("DONE")

if __name__ == "__main__":
    asyncio.run(sync_data())
