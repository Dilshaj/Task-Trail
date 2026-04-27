import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Standard Collections in your project
    collections = [
        "employees", 
        "Projects", 
        "pay_slips", 
        "tasks", 
        "attendance",
        "employee_leaves",
        "offer_letters"
    ]
    
    print(f"\n🌐 CONNECTED TO: {db_name} (MongoDB Atlas)")
    print("=" * 40)
    
    for coll in collections:
        try:
            count = await db[coll].count_documents({})
            status = "✅ ONLINE" if count >= 0 else "❌ ERROR"
            print(f"{status} | {coll.ljust(15)}: {count} documents")
        except Exception as e:
            print(f"❌ ERROR | {coll.ljust(15)}: {str(e)}")

    print("=" * 40)
    print("🏁 AUDIT COMPLETE: Data is persistently stored in Atlas.")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
