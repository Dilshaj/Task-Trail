import asyncio
import sys
import os
import time

sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '.')))
from app.db.mongo import db
from app.services.attendance_service import get_employee_status

async def main():
    db.connect()
    print("Polling get_employee_status every 10 seconds for 2 minutes...")
    for i in range(12):
        status = await get_employee_status('20280090')
        print(f"[{time.strftime('%X')}] Status: {status.get('is_checked_in')}")
        if not status.get('is_checked_in'):
            print("STATUS BECAME FALSE!")
            break
        await asyncio.sleep(10)

asyncio.run(main())
