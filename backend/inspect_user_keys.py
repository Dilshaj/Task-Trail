import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    user = await db.Employees.find_one({"name": {"$regex": "murali", "$options": "i"}})
    if user:
        print(f"Keys in Murali Document: {list(user.keys())}")
        print(f"Current Avatar Value: {user.get('avatar')}")
        print(f"Current Profile Image Value: {user.get('profile_image')}")
    else:
        print("User Murali not found.")

if __name__ == "__main__":
    asyncio.run(main())
