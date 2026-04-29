import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

async def check_projects():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    cursor = db.Projects.find({}, {"name": 1, "image": 1})
    projects = await cursor.to_list(length=20)
    for p in projects:
        print(f"Project: {p.get('name')} | Image: {p.get('image')}")

if __name__ == "__main__":
    asyncio.run(check_projects())
