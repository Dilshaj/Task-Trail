import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def find_admin():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("--- ADMIN RECORD ---")
    u = await db.Employees.find_one({"name": "Super Admin"})
    if not u:
        u = await db.Employees.find_one({"role": "admin"})
    if u:
        print(f"Admin: {u.get('name')}, Role: {u.get('role')}")
    else:
        print("No admin record found")

if __name__ == "__main__":
    asyncio.run(find_admin())
