import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def fix_admin():
    print("🛠️ Fixing Admin Credentials in Company DB...")
    
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Matching your collection name
    employees_collection = db["Employees"]

    # 1. Update Admin (CEO) to use 'password_hash' and ensure role is 'admin'
    await employees_collection.update_one(
        {"email": "dilshajceo@dilshajinfotech.tech"},
        {"$set": {
            "password_hash": pwd_context.hash("admin@123"),
            "role": "admin",
            "is_first_login": False
        }}
    )

    # 2. Update Test User
    await employees_collection.update_one(
        {"employee_id": "2026001"},
        {"$set": {
            "password_hash": pwd_context.hash("user"),
            "role": "user",
            "is_first_login": False
        }}
    )

    print("✅ Admin credentials fixed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_admin())
