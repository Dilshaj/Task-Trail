import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_types():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("\n--- EMPLOYEE PROJECT TYPES ---")
    emps = await db.Employees.find().to_list(100)
    for e in emps:
        pid = e.get("project_id")
        print(f"User: {e.get('name')}, ProjectID: {pid}, Type: {type(pid)}")

if __name__ == "__main__":
    asyncio.run(check_types())
