import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    uri = os.getenv("MONGO_URI")
    client = AsyncIOMotorClient(uri)
    db = client.worksheet_db
    user = await db.employees.find_one({"employee_id": "2026999"})
    if user:
        print(f"User: {user.get('name')} | Role: {user.get('role')} | Project: {user.get('project_id')}")
    else:
        print("User 2026999 not found")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
