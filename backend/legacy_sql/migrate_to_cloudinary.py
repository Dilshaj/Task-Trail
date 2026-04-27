import sys
import os
sys.path.append(os.getcwd())
from app.db.database import SessionLocal
from app.models.models import User, Project
from app.utils.cloudinary_utils import upload_base64_image

def migrate():
    db = SessionLocal()
    try:
        # Migrate Project Images (Base64 -> Cloudinary)
        # We also need to check for strings that start with "data:image"
        # We use a LIKE query with PostgreSQL or SQL Server style wildcard
        projects = db.query(Project).filter(Project.image.like('data:image%')).all()
        print(f"📦 Found {len(projects)} project images to migrate...")
        for p in projects:
            url = upload_base64_image(p.image, folder="projects")
            if url:
                p.image = url
                print(f"✅ Migrated project: {p.name}")
            else:
                print(f"⚠️ Failed to migrate project: {p.name}")
        
        # Migrate User Avatars if they are base64 (Unlikely given the code and DB setup, but safe to check)
        users = db.query(User).filter(User.avatar.like('data:image%')).all()
        print(f"📦 Found {len(users)} user avatars encoded in base64 to migrate...")
        for u in users:
             url = upload_base64_image(u.avatar, folder="avatars")
             if url:
                 u.avatar = url
                 print(f"✅ Migrated user avatar: {u.name}")
             else:
                 print(f"⚠️ Failed to migrate user avatar: {u.name}")

        db.commit()
        print("🚀 Migration complete!")
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
