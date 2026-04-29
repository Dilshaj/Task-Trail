import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

clouds = ["dv1sih7vk", "dv1sih7v", "task-trail", "tasktrail", "worksheet", "eduprova", "dilshaj"]

for cloud in clouds:
    cloudinary.config(
        cloud_name=cloud,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )
    try:
        print(f"Testing {cloud}...")
        cloudinary.uploader.upload("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
        print(f"✅ FOUND CORRECT CLOUD: {cloud}")
        break
    except Exception as e:
        print(f"❌ {cloud} failed: {e}")
