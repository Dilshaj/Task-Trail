import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from app.core.config import settings

# 🔹 Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = settings.get_database_url

# 🔹 Create engine safely
engine = None

try:
    engine = create_engine(
        DATABASE_URL,
        fast_executemany=True,
        pool_pre_ping=True,
        pool_recycle=3600
    )
    logger.info("✅ SQL Server engine configured successfully.")
except Exception as e:
    logger.error(f"❌ Error configuring DB engine: {e}")

# 🔹 Session setup (safe bind)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine if engine else None
)

# 🔹 Base model
Base = declarative_base()

# 🔹 Dependency
def get_db():
    if engine is None:
        raise Exception("Database not initialized properly")
        
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔹 Connection test
def test_database_connection():
    try:
        if engine is None:
            return False
            
        with engine.connect() as connection:
            logger.info("✅ DB connection successful.")
            return True
    except OperationalError as e:
        logger.error(f"❌ DB OperationalError: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected DB error: {e}")
        return False
