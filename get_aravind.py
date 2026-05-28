import asyncio
import os
from dotenv import load_dotenv
import motor.motor_asyncio

load_dotenv(dotenv_path="backend/.env")

async def main():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client[db_name]
    
    user = await db.Employees.find_one({"name": {"$regex": "aravind", "$options": "i"}})
    if user:
        print("Employee ID:", user.get("employee_id"))
        print("Email:", user.get("email"))
        print("Role:", user.get("role"))
        print("is_checked_in:", user.get("is_checked_in"))
    else:
        print("Not found")

if __name__ == "__main__":
    asyncio.run(main())
