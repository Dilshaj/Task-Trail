import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    print("--- Checking Projects in DB ---")
    cursor = db.Projects.find({})
    async for p in cursor:
        print(f"Project: {p.get('name')}")
        print(f"Image URL: {p.get('image')}")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(main())
