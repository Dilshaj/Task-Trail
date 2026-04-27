import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def deep_repair():
    print("🧹 Starting Deep Repair of all projects...")
    
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    projects_collection = db["Projects"]

    # 🌟 GUARANTEED VISIBLE BANNER
    vivid_banner = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=800&auto=format&fit=crop"

    # Find ANY project that has a Cloudinary link from the WRONG account (dzvk36pqu)
    # or the broken "default_project.png"
    result = await projects_collection.update_many(
        {
            "$or": [
                {"image": {"$regex": "dzvk36pqu"}},
                {"image": {"$regex": "default_project.png"}},
                {"image": None},
                {"image": ""}
            ]
        },
        {"$set": {"image": vivid_banner}}
    )

    print(f"✅ Deep Repair complete! {result.modified_count} projects were saved from the white-screen error.")
    client.close()

if __name__ == "__main__":
    asyncio.run(deep_repair())
