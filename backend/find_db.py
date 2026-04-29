import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    
    # Try common DB names
    for db_name in ["EduProva", "WorkSheet", "WorkSheet-cluster", "worksheet_db"]:
        db = client[db_name]
        try:
            colls = await db.list_collection_names()
            if colls:
                print(f"✅ Found data in DB: {db_name}")
                print(f"Collections: {colls}")
        except:
            pass

if __name__ == "__main__":
    asyncio.run(main())
