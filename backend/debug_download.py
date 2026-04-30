import asyncio
import motor.motor_asyncio
from bson import ObjectId

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    print("--- COLLECTION COUNTS ---")
    collections = await db.list_collection_names()
    for col in collections:
        count = await db[col].count_documents({})
        print(f"{col}: {count}")
    
    print("\n--- SAMPLE PAY SLIPS ---")
    cursor = db.pay_slips.find().limit(3)
    async for slip in cursor:
        print(f"ID: {slip.get('_id')}, EmpID: {slip.get('employee_id')}, Month: {slip.get('month')}")

    print("\n--- SAMPLE OFFER LETTERS ---")
    cursor = db.offer_letter.find().limit(3)
    async for offer in cursor:
        print(f"ID: {offer.get('_id')}, EmpID: {offer.get('employee_id')}")

if __name__ == "__main__":
    asyncio.run(main())
