import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

def test_clouds():
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    
    # Common guesses based on project
    for cloud in ["dv1sih7vk", "task-trail", "eduprova", "worksheet"]:
        cloudinary.config(
            cloud_name=cloud,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        try:
            print(f"Testing {cloud}...")
            # Simple list folders check
            from cloudinary import api
            api.root_folders()
            print(f"✅ FOUND CORRECT CLOUD: {cloud}")
            return
        except Exception as e:
            print(f"❌ {cloud} failed: {e}")

if __name__ == "__main__":
    test_clouds()
