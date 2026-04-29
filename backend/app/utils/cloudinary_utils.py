import cloudinary
import cloudinary.uploader
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# 🔒 Centralized Cloudinary Config
# Strictly using Environment Variables from centralized settings
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

# Debug (Sensitive info masked)
print(f"Cloudinary: {settings.CLOUDINARY_CLOUD_NAME} | Key: {settings.CLOUDINARY_API_KEY[:4]}... | Secret: {'Yes' if settings.CLOUDINARY_API_SECRET else 'No'}")

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
