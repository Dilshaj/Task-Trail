import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def debug_projects():
    print("🔍 Inspecting Projects in Company DB...")
    
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Matching your collection name
    projects_collection = db["Projects"]

    projects = await projects_collection.find().to_list(100)
    
    if not projects:
        print("❌ No projects found in DB.")
    else:
        for p in projects:
            print(f"\n📁 Project: {p.get('name')}")
            print(f"🔗 Image URL: {p.get('image')}")
            print(f"🆔 ID: {p.get('_id')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(debug_projects())
