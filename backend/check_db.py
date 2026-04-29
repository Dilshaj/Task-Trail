import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    print("--- Searching for user 'murali' ---")
    user = await db.employees.find_one({"name": {"$regex": "murali", "$options": "i"}})
    if user:
        print(f"Found User: {user.get('name')}")
        print(f"ID: {user.get('_id')}")
        print(f"Avatar: {user.get('avatar')}")
        print(f"Email: {user.get('email')}")
    else:
        print("User not found.")

    print("\n--- Recent Employees ---")
    cursor = db.employees.find().sort("created_at", -1).limit(5)
    async for emp in cursor:
        print(f"Name: {emp.get('name')}, Avatar: {emp.get('avatar')}")

if __name__ == "__main__":
    asyncio.run(main())
