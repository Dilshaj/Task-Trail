import asyncio
import motor.motor_asyncio
import os
import cloudinary
import cloudinary.uploader
from bson import ObjectId
from dotenv import load_dotenv

async def migrate_projects():
    # Load env
    load_dotenv()
    uri = os.getenv("MONGO_URI")
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    
    secret = os.getenv("CLOUDINARY_API_SECRET")
    print(f"DEBUG: Secret begins with {secret[:5]} and has length {len(secret)}")
    
    # Cloudinary Config
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=secret,
        secure=True
    )
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # Try a 1x1 test first
    print("Testing credentials with a 1x1 pixel...")
    try:
        cloudinary.uploader.upload("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
        print("✅ Credentials work!")
    except Exception as e:
        print(f"❌ Credentials FAIL: {e}")
        return

    cursor = db.Projects.find({"image": {"$regex": "^/uploads/"}})
    projects = await cursor.to_list(length=100)
    
    for p in projects:
        local_rel_path = p.get("image").lstrip("/") # uploads/projects/abc.png
        local_abs_path = os.path.join(BASE_DIR, local_rel_path)
        
        if os.path.exists(local_abs_path):
            print(f"📦 Uploading {p.get('name')} image...")
            try:
                res = cloudinary.uploader.upload(local_abs_path, folder="projects")
                new_url = res.get("secure_url")
                
                await db.Projects.update_one(
                    {"_id": p["_id"]},
                    {"$set": {"image": new_url}}
                )
                print(f"✅ Migrated: {p.get('name')} -> {new_url}")
            except Exception as e:
                print(f"❌ Failed to upload {p.get('name')}: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_projects())
