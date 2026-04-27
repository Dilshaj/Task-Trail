import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def inspect_system():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("------- SYSTEM INTEGRITY REPORT -------")
    
    # 1. Check Collections
    collections = await db.list_collection_names()
    print(f"Collections found: {collections}")
    
    # 2. Check Attendance Count
    attendance_count = await db.Attendance.count_documents({})
    print(f"Attendance Logs: {attendance_count}")
    
    # 3. Check Tasks Normalization
    tasks = await db.Tasks.find().to_list(length=5)
    print(f"Sample Tasks (Checking fields):")
    for t in tasks:
        print(f" - Title: {t.get('title')}, Assigned: {t.get('assigned_to')}, Project: {t.get('project_id')}")
    
    # 4. Check Employees
    employees_count = await db.Employees.count_documents({})
    print(f"Total Employees: {employees_count}")
    
    # 5. Check Projects
    projects_count = await db.Projects.count_documents({})
    print(f"Total Projects: {projects_count}")

    print("---------------------------------------")

if __name__ == "__main__":
    asyncio.run(inspect_system())
