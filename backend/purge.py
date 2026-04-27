import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def clean():
    client = AsyncIOMotorClient(os.getenv("MONGO_URI"))
    db = client[os.getenv("DB_NAME")]
    
    # 🎯 Delete tasks that have 'None' as a string or actual nulls
    # These were caused by the CamelCase naming mismatch
    res = await db.Tasks.delete_many({
        "$or": [
            {"assigned_to": None},
            {"assigned_to": "None"},
            {"project_id": "None"},
            {"project_id": None}
        ]
    })
    print(f"✅ Successfully purged {res.deleted_count} orphaned tasks from the database.")

if __name__ == "__main__":
    asyncio.run(clean())
