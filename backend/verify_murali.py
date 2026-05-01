import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

async def run():
    load_dotenv()
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv('MONGO_URI'))
    db = client['worksheet_db']
    cursor = db.Employees.find({})
    async for emp in cursor:
        print(f"Name: {emp.get('name')} | Avatar: {emp.get('avatar')}")

if __name__ == "__main__":
    asyncio.run(run())
