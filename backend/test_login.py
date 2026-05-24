import asyncio
from app.services import auth_service
from app.db.mongo import db

async def test():
    db.connect()
    
    # 1. Admin login with email
    email = "dilshajceo@dilshajinfotech.tech"
    password = "admin@123"
    print(f"Testing login for {email} / {password}...")
    user = await auth_service.authenticate_user(email, password)
    if user:
        print(f"✅ Success! User role: {user.get('role')}")
    else:
        print(f"❌ Failed to login for {email}")

    # 2. Team Lead login with employee_id
    emp_id = "TL-001"
    password_tl = "tl@123" # Wait, what is TL-001 password? Let's check if we know it.
    # In the database dump:
    # ID: TL-001, Email: eduprova123@gmail.com, Role: TEAM_LEAD, Pass: $2b$12$kMl2a/S6woXXPeCMWaZp2e1c1EL.Cx8XjNormkTdmyMyhdEISFkNK
    # Let's try password "admin@123" or something else? Wait, let's see.
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test())
