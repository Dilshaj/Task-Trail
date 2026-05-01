import asyncio
import motor.motor_asyncio
import os
from dotenv import load_dotenv

async def check_db_images():
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    print("\n--- 👤 Employees (Avatars) ---")
    cursor = db.Employees.find({}, {"name": 1, "avatar": 1}).limit(5)
    employees = await cursor.to_list(length=5)
    for emp in employees:
        avatar = emp.get('avatar', 'None')
        status = "✅ CLOUDINARY" if "cloudinary" in str(avatar).lower() else "❌ LOCAL/NONE"
        print(f"Name: {emp.get('name')} | Avatar: {avatar} | [{status}]")
        
    print("\n--- 📂 Projects (Logos) ---")
    cursor = db.Projects.find({}, {"name": 1, "image": 1}).limit(5)
    projects = await cursor.to_list(length=5)
    for proj in projects:
        img = proj.get('image', 'None')
        status = "✅ CLOUDINARY" if "cloudinary" in str(img).lower() else "❌ LOCAL/NONE"
        print(f"Project: {proj.get('name')} | Image: {img} | [{status}]")

if __name__ == "__main__":
    asyncio.run(check_db_images())
