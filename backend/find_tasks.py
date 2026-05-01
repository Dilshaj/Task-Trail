import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def find_tasks():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("--- TASKS SEARCH ---")
    ts = await db.Tasks.find().to_list(10)
    for t in ts:
        print(f"Title: {t.get('title')}, AssignedTo: {t.get('assigned_to')}, Status: {t.get('status')}")

if __name__ == "__main__":
    asyncio.run(find_tasks())
