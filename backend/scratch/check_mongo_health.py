import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_mongo():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    
    print(f"Connecting to: {uri[:20]}...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    try:
        # Check connection
        await client.admin.command('ping')
        print("OK: MongoDB Connection Successful")
        
        # Check collections
        collections = await db.list_collection_names()
        print(f"Collections: {collections}")
        
        # Try a test insert/delete in Tasks
        test_doc = {"title": "Test Task", "status": "Pending"}
        result = await db.Tasks.insert_one(test_doc)
        print(f"OK: Insert test successful: {result.inserted_id}")
        
        await db.Tasks.delete_one({"_id": result.inserted_id})
        print("OK: Delete test successful")
        
    except Exception as e:
        print(f"ERROR: MongoDB Check Failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_mongo())
