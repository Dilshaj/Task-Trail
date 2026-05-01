import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text, Boolean
from app.db.database import Base
from sqlalchemy.dialects.mssql import NVARCHAR

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

# 1. EMPLOYEES / USERS ACC
class User(Base):
    __tablename__ = "employees_table"
    
    id = Column(String(50), primary_key=True, index=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    employee_id = Column(String(50), index=True, nullable=False, unique=True)
    email = Column(String(100), index=True, nullable=True, unique=True)
    # Security fields (Mandatory for production)
    password_hash = Column(String(255), nullable=False)
    is_first_login = Column(Boolean, default=True)
    role = Column("user_role", String(20), default="user", nullable=False)
    avatar = Column("avatar_url", String(500), nullable=True)  # Cloudinary URL
    joining_date = Column(String(50), nullable=True) # 🔥 ADDED
    
    daily_progress = Column(Float, default=0.0, nullable=True)
    weekly_progress = Column(Float, default=0.0, nullable=True)
    project_id = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

# 2. PROJECTS


class Project(Base):
    __tablename__ = "projects"
    id = Column(String(50), primary_key=True, index=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    image = Column(String(500), nullable=True)  # Cloudinary URL
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

# 3. TASKS
class Task(Base):
    __tablename__ = "tasks"
    id = Column(String(50), primary_key=True, index=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(String(50), nullable=True)
    priority = Column(String(20), default="Medium", nullable=True)
    status = Column(String(20), default="Pending", nullable=True)
    timeline = Column(String(20), default="daily", nullable=True)
    assigned_to = Column(String(50), nullable=True)
    project_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

# 4. ATTENDANCE
class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(String(50), primary_key=True, index=True, default=generate_uuid)
    employee_id = Column(String(50), nullable=False)
    date = Column(String(50), nullable=False)
    check_in = Column(String(50), nullable=True)
    check_out = Column(String(50), nullable=True)
    location_name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

# 5. OFFER LETTERS
class OfferLetter(Base):
    __tablename__ = "offer_letters"
    id = Column(String(50), primary_key=True, index=True, default=generate_uuid)
    employee_id = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=True)
    joining_date = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    package = Column(String(100), nullable=True)
    project_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

# 6. LEAVE REQUESTS
class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String(50), primary_key=True, index=True, default=generate_uuid)
    employee_id = Column(String(50), nullable=False)
    leave_type = Column(String(50), nullable=False)
    from_date = Column(String(50), nullable=False)
    to_date = Column(String(50), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(20), default="Pending", nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

# 7. PAY SLIPS
class PaySlip(Base):
    __tablename__ = "pay_slips"

    id = Column(String(50), primary_key=True, index=True, default=generate_uuid)
    employee_id = Column(String(50), nullable=False)
    month = Column(String(50), nullable=False)
    amount = Column(String(50), nullable=False)
    status = Column(String(20), default="Generated", nullable=True)
    project_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
