import logging
import asyncio
from app.utils.cloudinary_utils import upload_image
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_upload():
    print("--- 🛠️ Cloudinary Integration Test ---")
    print(f"Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}")
    print(f"API Key: {settings.CLOUDINARY_API_KEY}")
    
    # Simple tiny image (1x1 transparent pixel base64)
    pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    
    try:
        print("Uploading test pixel...")
        # Since upload_image takes a file-like object or content, 
        # but upload_base64_image exists in the utils too.
        from app.utils.cloudinary_utils import upload_base64_image
        url = upload_base64_image(pixel, folder="test_diagnostics")
        print(f"✅ SUCCESS! URL: {url}")
    except Exception as e:
        print(f"❌ FAILED!")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Msg: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_upload())
