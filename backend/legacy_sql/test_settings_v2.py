import os
from pydantic_settings import BaseSettings
from pydantic import ValidationError

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduProva Backend"
    DB_HOST: str
    DB_PORT: str = "1433"
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DRIVER_NAME: str = "ODBC Driver 17 for SQL Server"
    ALLOWED_ORIGINS: list[str] = []
    SECRET_KEY: str = "default"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    class Config:
        env_file = ".env"
        extra = "ignore"

print(f"CWD: {os.getcwd()}")
print(f".env exists: {os.path.exists('.env')}")
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        print(f".env content first 10 chars: {f.read(10)}")

try:
    s = Settings()
    print("Settings loaded successfully!")
except ValidationError as e:
    print(f"Validation Error: {e.json(indent=2)}")
except Exception as e:
    print(f"Unexpected Error: {e}")
