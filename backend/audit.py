import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def inspect():
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("DB_NAME")]
    
    print("--- DETAILED TASK AUDIT ---")
    async for task in db.Tasks.find():
        print(f"Task: {task.get('title')}")
        print(f"  > assigned_to: '{task.get('assigned_to')}'")
        print(f"  > project_id:  '{task.get('project_id')}'")
        print(f"  > status:      '{task.get('status')}'")
    
    print("\n--- EMPLOYEE AUDIT ---")
    async for emp in db.Employees.find():
        print(f"Emp: {emp.get('name')} (ID: {str(emp.get('_id'))})")
        print(f"  > Project: {emp.get('project_id')}")

if __name__ == "__main__":
    asyncio.run(inspect())
