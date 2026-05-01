import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def test_raw_upload():
    try:
        print(f"Uploading to {cloudinary.config().cloud_name}...")
        res = cloudinary.uploader.upload("https://ui-avatars.com/api/?name=Final+Test", folder="avatars")
        print(f"✅ Success: {res.get('secure_url')}")
    except Exception as e:
        print(f"❌ Failed: {e}")

if __name__ == "__main__":
    test_raw_upload()
