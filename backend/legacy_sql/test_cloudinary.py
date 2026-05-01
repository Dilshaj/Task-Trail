import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def test_upload():
    try:
        # Upload a test image (e.g., from a URL or a dummy base64)
        print("Testing Cloudinary upload...")
        response = cloudinary.uploader.upload("https://ui-avatars.com/api/?name=Test+User", folder="test_folder")
        print(f"Success! URL: {response.get('secure_url')}")
    except Exception as e:
        print(f"Failure: {e}")

if __name__ == "__main__":
    test_upload()
