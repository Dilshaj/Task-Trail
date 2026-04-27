import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("DB_NAME")]
    
    murali = await db.Employees.find_one({"name": "murali"})
    print(f"MURALI_ID: {murali.get('_id')}")
    print(f"MURALI_AVATAR: {murali.get('avatar')}")

if __name__ == "__main__":
    asyncio.run(check())
