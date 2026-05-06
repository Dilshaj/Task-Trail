import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class MongoDB:
    def __init__(self):
        # Marker to verify this code is running
        try:
            with open("CODE_IS_RUNNING.txt", "w") as f:
                f.write(f"Running from: {os.getcwd()}\nTime: {datetime.now()}")
        except:
            pass
        self.client: AsyncIOMotorClient = None
        self.db = None
        self.uri = os.getenv("MONGO_URI")
        self.db_name = os.getenv("DB_NAME", "worksheet_db")

    def connect(self):
        """Initializes the MongoDB connection client and database."""
        if not self.uri:
            load_dotenv()
            self.uri = os.getenv("MONGO_URI")
            self.db_name = os.getenv("DB_NAME", "worksheet_db")
            
        if self.uri:
            self.client = AsyncIOMotorClient(self.uri)
            self.db = self.client[self.db_name]
            logger.info(f"✅ MongoDB connected: {self.db_name}")

    def close(self):
        """Closes the MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("❌ MongoDB connection closed")

    def ensure_connected(self):
        """Internal helper to ensure db is initialized."""
        if self.db is None:
            self.connect()

    # Property helpers - Mapping to your specific collection names
    @property
    def employees(self):
        self.ensure_connected()
        return self.db.Employees if self.db is not None else None

    @property
    def attendance(self):
        self.ensure_connected()
        return self.db.Attendance if self.db is not None else None

    @property
    def tasks(self):
        self.ensure_connected()
        return self.db.Tasks if self.db is not None else None
        
    @property
    def projects(self):
        self.ensure_connected()
        return self.db.Projects if self.db is not None else None

    @property
    def offers(self):
        self.ensure_connected()
        return self.db.Offers if self.db is not None else None

    @property
    def leaves(self):
        self.ensure_connected()
        return self.db.Leaves if self.db is not None else None

    @property
    def pay_slips(self):
        self.ensure_connected()
        return self.db.PaySlips if self.db is not None else None

# Initialize the engine instance
db = MongoDB()
