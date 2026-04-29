import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    
    # List databases
    dbs = await client.list_database_names()
    print(f"Available Databases: {dbs}")
    
    db = client['worksheet_db']
    collections = await db.list_collection_names()
    print(f"Collections in worksheet_db: {collections}")
    
    if 'employees' in collections:
        count = await db.employees.count_documents({})
        print(f"Total Employees: {count}")
        
        print("\n--- First 10 Employees ---")
        cursor = db.employees.find().limit(10)
        async for emp in cursor:
            print(f"ID: {emp.get('_id')}, Name: {emp.get('name')}, Avatar: {emp.get('avatar')}")

if __name__ == "__main__":
    asyncio.run(main())
