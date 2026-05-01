import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from app.models.models import User
print(f"User Table Name: {User.__tablename__}")
