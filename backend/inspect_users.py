import asyncio
from app.db.mongo import db

async def main():
    db.connect()
    cursor = db.employees.find({})
    async for emp in cursor:
        print(f"ID: {emp.get('employee_id')}, Email: {emp.get('email')}, Role: {emp.get('role')}, HasHash: {bool(emp.get('password_hash') or emp.get('password'))}, Pass: {emp.get('password') or emp.get('password_hash')}")
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
