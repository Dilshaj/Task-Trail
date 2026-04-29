import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

async def list_collections():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    names = await db.list_collection_names()
    print(f"Collections: {names}")

if __name__ == "__main__":
    asyncio.run(list_collections())
