import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("DB_NAME")]
    
    print("--- AVATAR AUDIT ---")
    async for emp in db.Employees.find():
        avatar = emp.get("avatar")
        print(f"Emp: {emp.get('name')}")
        print(f"  - Avatar: {avatar}")
        if avatar and not avatar.startswith("http"):
            print("  ⚠️ INVALID URL (Not starting with http)")

if __name__ == "__main__":
    asyncio.run(check())
