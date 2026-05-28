import asyncio
import sys
import os

# Add backend directory to sys.path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.db.mongo import db
from app.services.attendance_service import get_employee_status

async def main():
    await db.connect()
    # Find latest attendance log that has NO check_out
    log = await db.attendance.find_one({"check_out": None}, sort=[('created_at', -1)])
    if not log:
        print('No active checkins found in DB')
        return
    emp_id = log.get('employee_id')
    print(f'Latest active checkin for emp_id: {emp_id}')
    status = await get_employee_status(emp_id)
    print(f'get_employee_status result: {status}')

asyncio.run(main())
