from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.db.mongo import db
import os
import logging

# Define logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from app.core.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

def verify_password(plain_password, hashed_password):
    """Verifies a plain password against a bcrypt hash."""
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hashes a password using bcrypt."""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """Generates a valid JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    """Generates a long-lived JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def authenticate_user(identifier: str, password: str):
    """
    🚀 Authenticates user via MongoDB Atlas with Robust Field Matching.
    """
    if db.db is None:
        logger.warning(f"❌ AUTH TRACE: Database not connected for login attempt [{identifier}]")
        return None
    try:
        clean_id = identifier.strip()
        logger.info(f"🕵️ AUTH TRACE: Login attempt for [{clean_id}]")

        import re
        escaped_id = re.escape(clean_id)
        user = await db.employees.find_one({
            "$or": [
                {"email": {"$regex": f"^{escaped_id}$", "$options": "i"}},
                {"employee_id": clean_id}
            ]
        })

        if not user:
            logger.warning(f"❌ AUTH TRACE: User [{clean_id}] NOT FOUND in DB.")
            return None
        
        logger.info(f"✅ AUTH TRACE: User [{clean_id}] FOUND in DB. Role: {user.get('role')}")

        # 🛡️ Robust check: Support both 'password_hash' and 'password' keys
        stored_hash = user.get("password_hash") or user.get("password")
        
        if not stored_hash:
            logger.error(f"❌ AUTH TRACE: No password field found for {clean_id}")
            return None

        # Verify password
        is_match = verify_password(password, stored_hash)
        logger.info(f"🔍 AUTH TRACE: Password match result for [{clean_id}]: {is_match}")

        if is_match:
            logger.info(f"✅ AUTH TRACE: User [{clean_id}] authenticated successfully.")
            return user
        else:
            logger.warning(f"⚠️ AUTH TRACE: Password mismatch for [{clean_id}].")
            return None

    except Exception as e:
        logger.error(f"💥 AUTH TRACE ERROR: {str(e)}")
        return None
