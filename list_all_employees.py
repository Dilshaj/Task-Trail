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
    
    print("--- Listing ALL Employees ---")
    cursor = db.Employees.find()
    async for emp in cursor:
        print(f"Name: {emp.get('name')}, employee_id: {emp.get('employee_id')}, type: {type(emp.get('employee_id'))}")

if __name__ == "__main__":
    asyncio.run(main())
