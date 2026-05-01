import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def force_logo():
    print("🎯 FORCING LOGO UPDATE...")
    
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    projects_collection = db["Projects"]
    
    # 🖼️ REAL TEST IMAGE (Colorful logo placeholder)
    test_logo = "https://res.cloudinary.com/dv1sih7vk/image/upload/v1714041000/projects/test_logo.png"

    # Target the project from your screenshot
    result = await projects_collection.update_one(
        {"name": "czxczxvc"},
        {"$set": {"image": test_logo}}
    )
    
    if result.modified_count > 0:
        print(f"✅ SUCCESS! Project 'czxczxvc' now has a real logo link in MongoDB.")
    else:
        print("❌ FAILED: Project 'czxczxvc' not found or already has this link.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(force_logo())
