import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# ???? HARD-LINKED COMPANY ACCOUNT (dv1sih7vk)
# This overrides any ghost variables and locks the app to your account.
cloudinary.config(
    cloud_name="dv1sih7vk",
    api_key="639177816396555",
    api_secret="3oKYOpuJTUAIU0aZO58Bpa1luc"
)

# ???? RELIABLE PLACEHOLDER (UI-Avatars)
DEFAULT_IMAGE = "https://ui-avatars.com/api/?name=System&background=random&color=fff&bold=true"

def upload_image(file, folder="projects"):
    """
    Guaranteed Company Upload to dv1sih7vk.
    """
    try:
        upload_result = cloudinary.uploader.upload(file, folder=folder)
        url = upload_result.get("secure_url")
        print(f"??? LOGO UPLOAD SUCCESS: {url}")
        return url
    except Exception as e:
        logger.error(f"??? Cloudinary Upload Error: {e}")
        raise e

def upload_base64_image(base64_string, folder="projects"):
    """
    Guaranteed Company Profile Upload to dv1sih7vk.
    """
    try:
        upload_result = cloudinary.uploader.upload(base64_string, folder=folder)
        return upload_result.get("secure_url")
    except Exception as e:
        logger.error(f"??? Cloudinary Base64 Error: {e}")
        raise e
