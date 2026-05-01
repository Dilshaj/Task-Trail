import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def list_collections():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    collections = await db.list_collection_names()
    print(f"Collections: {collections}")
    
    for coll in collections:
        count = await db[coll].count_documents({})
        print(f"Count for '{coll}': {count}")

if __name__ == "__main__":
    asyncio.run(list_collections())
