import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

async def migrate_avatars():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    
    print(f"Connecting to {db_name}...")
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # 1. Migrate Employees
    print("Migrating Employees...")
    cursor = db.Employees.find({}) # Matching mongo.py casing
    count = 0
    async for emp in cursor:
        avatar = emp.get("avatar")
        name = emp.get("name", "User")
        
        # Check if needs replacement
        is_broken = not avatar or avatar == "" or avatar == "undefined" or avatar == "null" or "/uploads/" in str(avatar)
        is_ghost = "dzvk36pqu" in str(avatar).lower()
        
        if is_broken or is_ghost:
            new_avatar = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=random&color=fff&bold=true"
            await db.Employees.update_one({"_id": emp["_id"]}, {"$set": {"avatar": new_avatar}})
            count += 1
            
    print(f"✅ Migrated {count} Employee avatars.")

    # 2. Migrate Projects
    print("Migrating Projects...")
    cursor = db.Projects.find({})
    p_count = 0
    async for proj in cursor:
        image = proj.get("image")
        
        if not image or "/uploads/" in str(image):
            new_img = "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=500&auto=format&fit=crop"
            await db.Projects.update_one({"_id": proj["_id"]}, {"$set": {"image": new_img}})
            p_count += 1
            
    print(f"✅ Migrated {p_count} Project logos.")

if __name__ == "__main__":
    asyncio.run(migrate_avatars())
