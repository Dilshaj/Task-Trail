import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def audit():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print(f"🧐 AUDITING COLLECTION: Projects in {db_name}")
    
    # We check the "Projects" collection (Capital P as identified in your mapping)
    projects_collection = db["Projects"]
    
    cursor = projects_collection.find({})
    projects = await cursor.to_list(length=100)
    
    if not projects:
        print("❌ NO PROJECTS FOUND IN DB!")
        return

    for p in projects:
        name = p.get("name", "Unknown")
        img = p.get("image", "MISSING")
        print(f"📁 Project: {name}")
        print(f"🔗 Image URL in DB: {img}")
        
        if "dzvk36pqu" in str(img):
            print("⚠️ WARNING: This project is using the OLD test account!")
        elif "unsplash" in str(img):
            print("ℹ️ NOTE: This project is using the Blue Placeholder.")
        elif "dv1sih7vk" in str(img):
            print("✅ SUCCESS: This project is using your OFFICIAL Company account!")
        print("-" * 30)

    client.close()

if __name__ == "__main__":
    asyncio.run(audit())
