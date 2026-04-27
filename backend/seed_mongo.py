import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "eduprova")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_data():
    print(f"🔗 Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # 👑 1. ADMIN USER
    admin_email = "dilshajceo@dilshajinfotech.tech"
    print(f"👑 Creating Admin: {admin_email}")
    await db.employees.update_one(
        {"email": admin_email},
        {"$set": {
            "employee_id": "ADMIN-001",
            "name": "Super Admin",
            "email": admin_email,
            "role": "admin",
            "password_hash": pwd_context.hash("admin@123"),
            "created_at": "2026-04-24T00:00:00Z"
        }},
        upsert=True
    )

    # 👤 2. TEST EMPLOYEE
    user_id = "2026999"
    print(f"👤 Creating Employee: {user_id}")
    await db.employees.update_one(
        {"employee_id": user_id},
        {"$set": {
            "employee_id": user_id,
            "name": "Murali Employee",
            "email": "murali@example.com",
            "role": "user",
            "password_hash": pwd_context.hash("user"), # Password is 'user'
            "created_at": "2026-04-24T00:00:00Z"
        }},
        upsert=True
    )
    
    print("\n✅ SEEDING COMPLETE!")
    print("-----------------------------------------")
    print("🔓 ADMIN LOGIN:")
    print(f"   Email: {admin_email}")
    print(f"   Pass:  admin@123")
    print("-----------------------------------------")
    print("🔓 USER LOGIN:")
    print(f"   ID:    {user_id}")
    print(f"   Pass:  user")
    print("-----------------------------------------")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
