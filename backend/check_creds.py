import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # backend/
load_dotenv(os.path.join(BASE_DIR, ".env"))

print(f"Cloud Name: {repr(os.getenv('CLOUDINARY_CLOUD_NAME'))}")
print(f"API Key: {repr(os.getenv('CLOUDINARY_API_KEY'))}")
print(f"API Secret: {repr(os.getenv('CLOUDINARY_API_SECRET'))}")
