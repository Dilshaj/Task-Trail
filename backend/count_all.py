import asyncio
import motor.motor_asyncio

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    collections = await db.list_collection_names()
    for coll in sorted(collections):
        count = await db[coll].count_documents({})
        print(f"{coll}: {count}")

if __name__ == "__main__":
    asyncio.run(main())
