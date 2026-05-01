import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    print(f"Connected to DB: {db.name}")
    print(f"Collections: {await db.list_collection_names()}")
    
    print("\n--- All Employees with project_id ---")
    cursor = db.Employees.find().limit(5)
    async for emp in cursor:
        p_id = emp.get('project_id')
        print(f"Name: {emp.get('name')}, project_id: {p_id}, type: {type(p_id)}")

if __name__ == "__main__":
    asyncio.run(main())
