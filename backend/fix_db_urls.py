import asyncio
import os
import re
from dotenv import load_dotenv
from app.db.mongo import db

async def run():
    db.connect()
    if not db.client:
        print("Could not connect to DB.")
        return

    print("Fixing Employees avatars...")
    emp_cursor = db.employees.find({})
    async for emp in emp_cursor:
        avatar = emp.get("avatar", "")
        if avatar and "/uploads/" in str(avatar) and str(avatar).startswith("http"):
            new_avatar = re.sub(r"https?://[^/]+", "", str(avatar))
            print(f"Updating employee {emp.get('_id')} avatar to {new_avatar}")
            await db.employees.update_one({"_id": emp["_id"]}, {"$set": {"avatar": new_avatar}})

    print("Fixing Projects images...")
    proj_cursor = db.projects.find({})
    async for proj in proj_cursor:
        image = proj.get("image", "")
        if image and "/uploads/" in str(image) and str(image).startswith("http"):
            new_image = re.sub(r"https?://[^/]+", "", str(image))
            print(f"Updating project {proj.get('_id')} image to {new_image}")
            await db.projects.update_one({"_id": proj["_id"]}, {"$set": {"image": new_image}})
            
        image_url = proj.get("image_url", "")
        if image_url and "/uploads/" in str(image_url) and str(image_url).startswith("http"):
            new_image_url = re.sub(r"https?://[^/]+", "", str(image_url))
            print(f"Updating project {proj.get('_id')} image_url to {new_image_url}")
            await db.projects.update_one({"_id": proj["_id"]}, {"$set": {"image_url": new_image_url}})

    db.close()
    print("Done")

if __name__ == "__main__":
    asyncio.run(run())
