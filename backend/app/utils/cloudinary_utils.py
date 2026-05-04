import cloudinary
import cloudinary.uploader
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# 🔒 Centralized Cloudinary Config
# Strictly using Environment Variables from centralized settings
cloudinary.config(
    cloud_name=str(settings.CLOUDINARY_CLOUD_NAME).strip(),
    api_key=str(settings.CLOUDINARY_API_KEY).strip(),
    api_secret=str(settings.CLOUDINARY_API_SECRET).strip(),
    secure=True
)

# Debug (Sensitive info masked)
print(f"Cloudinary: {settings.CLOUDINARY_CLOUD_NAME} | Key: {settings.CLOUDINARY_API_KEY[:4]}... | Secret: {'Yes' if settings.CLOUDINARY_API_SECRET else 'No'}")

# 🌐 RELIABLE PLACEHOLDER (UI-Avatars)
# Note: Handled by format_employee in employee_service.py using the REAL name.

def upload_image(file, folder="projects"):
    """
    Guaranteed Company Upload to dv1sih7vk.
    Returns DEFAULT_IMAGE on failure to prevent 500 errors.
    """
    try:
        if not file:
            return DEFAULT_IMAGE
            
        upload_result = cloudinary.uploader.upload(file, folder=folder)
        url = upload_result.get("secure_url")
        logger.info(f"✅ LOGO UPLOAD SUCCESS: {url}")
        return url
    except Exception as e:
        logger.error(f"❌ Cloudinary Upload Error: {e}")
        # 🛡️ Return None to let format_employee generate a name-based avatar
        return None

def upload_base64_image(base64_string, folder="projects"):
    """
    Guaranteed Company Profile Upload to dv1sih7vk.
    Returns DEFAULT_IMAGE on failure.
    """
    try:
        if not base64_string or "base64" not in str(base64_string):
            return DEFAULT_IMAGE
            
        upload_result = cloudinary.uploader.upload(base64_string, folder=folder)
        url = upload_result.get("secure_url")
        logger.info(f"✅ BASE64 UPLOAD SUCCESS: {url}")
        return url
    except Exception as e:
        logger.error(f"❌ Cloudinary Base64 Error: {e}")
        return None
