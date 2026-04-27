import sys
import os
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.models import User
from app.utils.security import get_password_hash

db = SessionLocal()
try:
    admin_email = "dilshajceo@dilshajinfotech.tech"
    admin_password = "admin@123"
    
    # Find any existing admin user
    admin_user = db.query(User).filter(User.role == "admin").first()
    
    if admin_user:
        print("Found existing admin user, updating credentials...")
        admin_user.email = admin_email
        admin_user.password_hash = get_password_hash(admin_password)
        admin_user.role = "admin"
        db.commit()
        print("Admin user updated successfully.")
    else:
        print("Creating default admin user...")
        new_admin = User(
            name="Admin",
            email=admin_email,
            password_hash=get_password_hash(admin_password),
            role="admin",
            is_first_login=True,
            avatar="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
        )
        db.add(new_admin)
        db.commit()
        print("Default admin user created.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
