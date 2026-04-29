import os
import cloudinary

print(f"OS CLOUDINARY_URL: {os.getenv('CLOUDINARY_URL')}")
print(f"SDK Config Secret: {cloudinary.config().api_secret}")
