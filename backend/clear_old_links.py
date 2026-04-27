import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def reset_logos():
    print("🚀 RESETTING OLD LOGO LINKS...")
    
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    projects_collection = db["Projects"]
    
    # 🎯 TARGET: Any link from the old account (dzvk36pqu)
    # We set them to empty string so the system knows to let you re-upload
    result = await projects_collection.update_many(
        {"image": {"$regex": "dzvk36pqu"}},
        {"$set": {"image": ""}}
    )
    
    print(f"✅ Reset complete! {result.modified_count} projects were cleared of old test links.")
    print("👉 YOU CAN NOW UPLOAD YOUR REAL LOGOS!")
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_logos())
