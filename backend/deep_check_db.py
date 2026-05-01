import asyncio
import re
from app.db.mongo import db

async def run():
    db.connect()
    if not db.client: return

    print("Checking for remaining :8000 references...")
    
    collections = ["Employees", "Projects", "Tasks", "Attendance", "PaySlips", "Offers"]
    found_any = False
    
    for coll_name in collections:
        coll = db.db[coll_name]
        cursor = coll.find({"$or": [
            {"avatar": {"$regex": ":8000"}},
            {"image": {"$regex": ":8000"}},
            {"image_url": {"$regex": ":8000"}}
        ]})
        
        async for doc in cursor:
            found_any = True
            print(f"Found in {coll_name} (ID: {doc.get('_id')}):")
            for key, val in doc.items():
                if isinstance(val, str) and ":8000" in val:
                    print(f"  {key}: {val}")
                    # Auto repair
                    new_val = re.sub(r"https?://[^/]+:8000", "", val)
                    print(f"  -> Suggesting repair to: {new_val}")
                    # Apply fix immediately
                    # await coll.update_one({"_id": doc["_id"]}, {"$set": {key: new_val}})

    if not found_any:
        print("No :8000 references found in tracked fields in DB.")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(run())
