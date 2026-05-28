import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '.')))
from app.db.mongo import db

async def main():
    db.connect()
    logs = await db.attendance.find({'employee_id': '20280090'}).to_list(length=10)
    for l in logs:
        print(l.get('date'), l.get('check_in'), l.get('check_out'))

asyncio.run(main())
