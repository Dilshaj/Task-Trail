import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class MongoDB:
    def __init__(self):
        self.client: AsyncIOMotorClient = None
        self.db = None
        self.uri = os.getenv("MONGO_URI")
        self.db_name = os.getenv("DB_NAME", "worksheet_db")

    def connect(self):
        """Initializes the MongoDB connection client and database."""
        if not self.uri:
            logger.warning("MONGO_URI not found in .env! MongoDB will not connect.")
            return
        self.client = AsyncIOMotorClient(self.uri)
        self.db = self.client[self.db_name]
        masked_uri = self.uri[:15] + "..." if self.uri else "None"
        logger.info(f"Connecting to MongoDB with URI: {masked_uri}")
        logger.info(f"Company MongoDB connected: {self.db_name}")

    def close(self):
        """Closes the MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("Company MongoDB connection closed")

    # Property helpers - Mapping to your specific collection names
    @property
    def employees(self):
        # Pointing to the Capitalized collection in your screenshot
        return self.db.Employees

    @property
    def attendance(self):
        return self.db.Attendance

    @property
    def tasks(self):
        return self.db.Tasks
        
    @property
    def projects(self):
        return self.db.Projects

    @property
    def offers(self):
        return self.db.Offers

    @property
    def leaves(self):
        return self.db.Leaves

    @property
    def pay_slips(self):
        return self.db.PaySlips

# Initialize the engine instance
db = MongoDB()
