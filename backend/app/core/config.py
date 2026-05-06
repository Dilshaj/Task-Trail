from typing import Optional
from pydantic_settings import BaseSettings
from urllib.parse import quote_plus


class Settings(BaseSettings):
    PROJECT_NAME: str = "EduProva Backend"

    # Database Settings (Legacy SQL - no longer strictly required for MongoDB)
    DB_HOST: str = "localhost"
    DB_PORT: str = "1433"
    DB_NAME: str = "EduProva"
    DB_USER: str = "admin"
    DB_PASSWORD: str = "password"
    DRIVER_NAME: str = "ODBC Driver 17 for SQL Server"

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://18.60.233.8",
        "http://18.60.233.8:5000",
        "http://18.61.228.91",
        "http://18.61.228.91:5173",
        "*"
    ]

    # JWT
    SECRET_KEY: str = "EduProva_Default_Secret_Key_Change_Me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cloudinary Config (Optional)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    @property
    def get_database_url(self) -> str:
        encoded_password = quote_plus(self.DB_PASSWORD)

        return (
            f"mssql+pyodbc://{self.DB_USER}:{encoded_password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            f"?driver={self.DRIVER_NAME}"
            f"&Encrypt=yes&TrustServerCertificate=yes"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Settings loaded successfully.
