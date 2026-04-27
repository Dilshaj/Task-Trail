import logging
import os
import sys

# Add the parent directory to sys.path to resolve 'app' imports correctly from script level
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.models import User, Project, Task
from app.utils.security import get_password_hash

# Setup Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_database():
    """
    Safely seeds the Microsoft SQL Server database with initial dummy data for testing.
    This process is idempotent. It will not duplicate records if executed multiple times.
    """
    
    # Initialize connection session
    db = SessionLocal()
    
    try:
        logger.info("Verifying and Creating SQL Schema Tables if they do not exist...")
        Base.metadata.create_all(bind=engine)
        
        # 1. Seed Admin User
        admin_email = "admin@eduprova.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin_id = "a1"
            admin = User(
                id=admin_id,
                name="Admin User",
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                role="admin",
                avatar="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff"
            )
            db.add(admin)
            db.commit()
            logger.info("Successfully Seeded: Admin User")
        else:
            logger.info("Admin User already exists. Skipping.")

        # 2. Seed Initial Project
        project_name = "EduProva Launch"
        project = db.query(Project).filter(Project.name == project_name).first()
        if not project:
            project_id = "p1"
            project = Project(
                id=project_id,
                name=project_name,
                image="https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=400&h=300&fit=crop"
            )
            db.add(project)
            db.commit()
            logger.info(f"Successfully Seeded: Project '{project_name}'")
        else:
            project_id = project.id
            logger.info("Project already exists. Skipping.")

        # 3. Seed Employee User
        user_email = "user@eduprova.com"
        employee = db.query(User).filter(User.email == user_email).first()
        if not employee:
            employee_id = "u1"
            employee = User(
                id=employee_id,
                name="John Employee",
                email=user_email,
                password_hash=get_password_hash("user123"),
                role="user",
                project_id=project_id,
                avatar="https://ui-avatars.com/api/?name=John+Employee&background=random",
                daily_progress=60.0,
                weekly_progress=40.0
            )
            db.add(employee)
            db.commit()
            logger.info("Successfully Seeded: Employee Testing User")
        else:
            employee_id = employee.id
            logger.info("Employee User already exists. Skipping.")

        # 4. Seed Dummy Tasks mappings
        if db.query(Task).count() == 0:
            tasks = [
                Task(id="t1", title="Design Database Schema", description="Create Microsoft SQL Architecture", deadline="2026-03-20", priority="High", timeline="weekly", assigned_to=employee_id, project_id=project_id, status="In Progress"),
                Task(id="t2", title="Setup Authentication", description="FastAPI JWT architecture mapped to frontend UI.", deadline="2026-03-10", priority="Medium", timeline="daily", assigned_to=employee_id, project_id=project_id, status="Completed"),
                Task(id="t3", title="Prepare Admin Dashboard UI", description="Implement custom aggregations in SQLAlchemy.", deadline="2026-03-15", priority="Low", timeline="weekly", assigned_to=employee_id, project_id=project_id, status="Pending")
            ]
            
            db.bulk_save_objects(tasks)
            db.commit()
            logger.info("Successfully Seeded: Initial 3 Tasks mapped to backend schemas.")
        else:
            logger.info("Tasks already exist in database. Skipping.")

        logger.info("Database Seeding Completed Successfully! The backend can be started.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
