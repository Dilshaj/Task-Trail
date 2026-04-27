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

try:
    s = Settings()
    print("Settings loaded successfully!")
except ValidationError as e:
    print(f"Validation Error: {e.errors()}")
except Exception as e:
    print(f"Unexpected Error: {e}")
