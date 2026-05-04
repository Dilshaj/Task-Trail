import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def main():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    colls = ['employees', 'Employees', 'Leaves', 'leave_requests']
    for c in colls:
        count = await db[c].count_documents({})
        print(f"{c}: {count} documents")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
