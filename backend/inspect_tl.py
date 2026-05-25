import asyncio
from app.db.mongo import db

async def main():
    db.connect()
    # Find employee with ID containing 'TL' or email containing 'digitalnews' or 'TL'
    cursor = db.employees.find({
        "$or": [
            {"employee_id": {"$regex": "TL", "$options": "i"}},
            {"email": {"$regex": "digitalnews", "$options": "i"}},
            {"name": {"$regex": "digital", "$options": "i"}}
        ]
    })
    tl_users = await cursor.to_list(length=100)
    print(f"Matching Team Leads or DigitalNews users:")
    for user in tl_users:
        print(f"ID: {user.get('employee_id')} | Name: {user.get('name')} | Email: {user.get('email')} | Role: {user.get('role')} | HasPassword: {bool(user.get('password') or user.get('password_hash'))}")
        # Print first few chars of password or password_hash if they exist
        if user.get('password'):
            print(f"  password field: {user.get('password')}")
        if user.get('password_hash'):
            print(f"  password_hash field: {user.get('password_hash')[:15]}...")
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
