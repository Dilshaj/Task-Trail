import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def find_project_id():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("--- PROJECT SEARCH ---")
    p = await db.Projects.find_one({"name": {"$regex": "eduprova", "$options": "i"}})
    if p:
        print(f"Project Name: {p.get('name')}, ID: {p.get('_id')}, ID_STR: {str(p.get('_id'))}")
    else:
        print("Project not found by name 'eduprova'")
        ps = await db.Projects.find().to_list(10)
        for p in ps:
            print(f"Found: {p.get('name')}, ID: {p.get('_id')}")

if __name__ == "__main__":
    asyncio.run(find_project_id())
