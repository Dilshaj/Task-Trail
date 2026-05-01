import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    
    db_name = 'worksheet-cluster'
    print(f"--- Checking database: {db_name} ---")
    db = client[db_name]
    collections = await db.list_collection_names()
    print(f"Collections: {collections}")
    
    if 'Employees' in collections:
        emp = await db.Employees.find_one({"name": {"$regex": "murali", "$options": "i"}})
        print(f"User Murali: {emp}")
    else:
        print("Employees collection not found.")

if __name__ == "__main__":
    asyncio.run(main())
