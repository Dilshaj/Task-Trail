from app.db.database import SessionLocal
from app.models.models import User

def fix_avatars():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            if user.avatar:
                old_avatar = user.avatar
                # If it's a hardcoded URL but NOT ui-avatars, make it relative
                if ("http://127.0.0.1" in old_avatar or "http://localhost" in old_avatar or "http://16.112" in old_avatar) and "ui-avatars.com" not in old_avatar:
                    if "/static/" in old_avatar:
                        user.avatar = "/static/" + old_avatar.split("/static/")[-1]
                        print(f"Fixed avatar for {user.name}: {old_avatar} -> {user.avatar}")
                    elif "/uploads/" in old_avatar:
                        user.avatar = "/uploads/" + old_avatar.split("/uploads/")[-1]
                        print(f"Fixed avatar for {user.name}: {old_avatar} -> {user.avatar}")
        
        db.commit()
        print("Database avatars fixed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error fixing avatars: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_avatars()
