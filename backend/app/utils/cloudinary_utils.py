import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
import logging

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # backend/
load_dotenv(os.path.join(BASE_DIR, ".env"))
logger = logging.getLogger(__name__)

# 🔒 Centralized Cloudinary Config
import cloudinary
import cloudinary.uploader

# 🔒 Centralized Cloudinary Config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dv1sih7vk"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "639177816396555"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "3oKYOpuJTUAIU0aZO58Bpa1luc"),
    secure=True
)

# CRITICAL DEBUG: Print config (masking secret)
conf = cloudinary.config()
print(f"☁️ [CLOUDINARY] Config Active: {conf.cloud_name}, Key: {conf.api_key}, Secret Loaded: {'Yes' if conf.api_secret else 'No'}")

# 🌐 RELIABLE PLACEHOLDER (UI-Avatars)
DEFAULT_IMAGE = "https://ui-avatars.com/api/?name=System&background=random&color=fff&bold=true"

def upload_image(file, folder="projects"):
    """
    Guaranteed Company Upload to dv1sih7vk.
    """
    try:
        upload_result = cloudinary.uploader.upload(file, folder=folder)
        url = upload_result.get("secure_url")
        print(f"✅ LOGO UPLOAD SUCCESS: {url}")
        return url
    except Exception as e:
        logger.error(f"❌ Cloudinary Upload Error: {e}")
        raise e

def upload_base64_image(base64_string, folder="projects"):
    """
    Guaranteed Company Profile Upload to dv1sih7vk.
    """
    try:
        upload_result = cloudinary.uploader.upload(base64_string, folder=folder)
        return upload_result.get("secure_url")
    except Exception as e:
        logger.error(f"❌ Cloudinary Base64 Error: {e}")
        raise e
