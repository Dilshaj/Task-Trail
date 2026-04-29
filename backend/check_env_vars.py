import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

print("--- CLOUDINARY ENVS ---")
for k, v in os.environ.items():
    if "CLOUDINARY" in k:
        print(f"{k}: {v[:4]}...{v[-4:] if len(v) > 4 else ''}")
