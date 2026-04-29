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

print(f"Testing Cloudinary for: {cloudinary.config().cloud_name}")

try:
    # Try a simple "ping" by pinging the tags or similar (or just upload a 1x1 pixel)
    # Most reliable way: Try to list folders (requires API key/secret proof)
    from cloudinary import api
    res = api.root_folders()
    print("✅ CONNECTION SUCCESSFUL!")
    print(f"Folders: {res.get('folders')}")
except Exception as e:
    print("❌ CONNECTION FAILED!")
    print(f"Error: {e}")
