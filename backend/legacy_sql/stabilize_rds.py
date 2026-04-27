import os
import sys
import logging
from dotenv import load_dotenv
import pyodbc
from sqlalchemy import text

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Stabilizer")

# Manually add current directory to sys.path to import app modules
sys.path.append(os.getcwd())

from app.db.database import engine, Base, SessionLocal
from app.models.models import User, Project, Task, Attendance, OfferLetter, LeaveRequest
from app.utils.security import get_password_hash

def drop_legacy_tables():
    """Drops tables that are not part of the current schema or were misconfigured."""
    server = os.getenv("DB_HOST")
    database = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    
    # We try different drivers as per the production config
    drivers = ['ODBC Driver 18 for SQL Server', 'ODBC Driver 17 for SQL Server', 'SQL Server']
    conn = None
    for drv in drivers:
        try:
            conn_str = f'DRIVER={{{drv}}};SERVER={server};DATABASE={database};UID={user};PWD={password};Encrypt=yes;TrustServerCertificate=yes'
            conn = pyodbc.connect(conn_str, timeout=10)
            logger.info(f"Connected with {drv}")
            break
        except Exception as e:
            logger.debug(f"Failed with {drv}: {e}")
            continue
            
    if not conn:
        logger.error("Could not connect to RDS to perform cleanup.")
        return False

    cursor = conn.cursor()
    # Table names to drop to ensure a fresh, clean schema based on current models.py
    # We include both the actual tablename and potential legacy names
    tables_to_drop = [
        'test_table', 'users', 'userId', 'employees', 'employees_table', 
        'tasks', 'attendance', 'projects', 'offer_letters', 'leave_requests'
    ]
    
    for table in tables_to_drop:
        try:
            # We use IF OBJECT_ID search to avoid errors on non-existent tables
            cursor.execute(f"IF OBJECT_ID('[{table}]', 'U') IS NOT NULL DROP TABLE [{table}]")
            logger.info(f"Cleared legacy/old table: {table}")
        except Exception as e:
            logger.warning(f"Error dropping {table}: {e}")
    
    conn.commit()
    conn.close()
    return True

def initialize_schema():
    """Initializes the database schema using SQLAlchemy Base.metadata."""
    logger.info("Initializing fresh database schema...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"Error initializing schema: {e}")
        return False

def seed_admin():
    """Seeds the default admin user with correct production credentials."""
    logger.info("Seeding admin user...")
    db = SessionLocal()
    try:
        # Production Admin Details
        admin_eid = "ADMIN-001"
        admin_name = "System Admin"
        admin_email = "dilshajceo@dilshajinfotech.tech"
        admin_pass = "admin@123"
        
        # Check if exists
        admin = db.query(User).filter(User.employee_id == admin_eid).first()
        if not admin:
            admin = User(
                name=admin_name,
                employee_id=admin_eid,
                email=admin_email,
                role="admin",
                password_hash=get_password_hash(admin_pass),
                is_first_login=False,
                avatar=f"https://ui-avatars.com/api/?name={admin_name.replace(' ', '+')}&background=random"
            )
            db.add(admin)
            db.commit()
            logger.info(f"Admin user {admin_eid} created successfully.")
        else:
            logger.info(f"Admin user {admin_eid} already exists.")
    except Exception as e:
        logger.error(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    logger.info("=== EduProva RDS Stabilization Started ===")
    
    # Step 1: Cleanup
    if drop_legacy_tables():
        # Step 2: Schema Creation
        if initialize_schema():
            # Step 3: Seeding
            seed_admin()
            logger.info("=== RDS Stabilization Complete! ===")
        else:
            logger.error("Initialization failed. Please check connection parameters.")
    else:
        logger.error("Cleanup failed. Please check RDS connectivity.")

if __name__ == "__main__":
    main()
