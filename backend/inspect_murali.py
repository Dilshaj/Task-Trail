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
    
    print("--- MURALI INSPECTION ---")
    u = await db.Employees.find_one({"name": "murali"})
    if u:
        pid = u.get("project_id")
        print(f"User: murali, project_id: {pid}, len: {len(str(pid)) if pid else 0}")
    else:
        print("Murali not found")

if __name__ == "__main__":
    asyncio.run(inspect())
