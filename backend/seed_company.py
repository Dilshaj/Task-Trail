import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_company_db():
    print("🚀 Seeding Company MongoDB Atlas...")
    
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    
    if not uri:
        print("❌ Error: MONGO_URI not found in .env")
        return

    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Use 'Employees' to match the user's screenshot
    employees_collection = db["Employees"]

    # 1. Create Admin (CEO)
    admin_user = {
        "employee_id": "ADMIN-CEO",
        "name": "Super Admin",
        "email": "dilshajceo@dilshajinfotech.tech",
        "password": pwd_context.hash("admin@123"),
        "role": "admin",
        "is_first_login": False
    }

    # 2. Create a Test User (ID: 2026001)
    test_user = {
        "employee_id": "2026001",
        "name": "Test User",
        "password": pwd_context.hash("user"),
        "role": "user",
        "is_first_login": False
    }

    # Insert Admin
    await employees_collection.update_one(
        {"email": admin_user["email"]},
        {"$set": admin_user},
        upsert=True
    )
    print(f"✅ Admin Account created: {admin_user['email']}")

    # Insert Test User
    await employees_collection.update_one(
        {"employee_id": test_user["employee_id"]},
        {"$set": test_user},
        upsert=True
    )
    print(f"✅ Test User created: {test_user['employee_id']}")

    print("\n✨ Company Database Seeding Complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_company_db())
