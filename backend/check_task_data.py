import asyncio
import logging
from app.db.mongo import db
from datetime import datetime

logging.basicConfig(level=logging.INFO)

async def check_tasks():
    db.connect()
    print("Connected to MongoDB")
    try:
        cursor = db.tasks.find({})
        tasks = await cursor.to_list(length=1000)
        print(f"Found {len(tasks)} tasks")
        for t in tasks:
            ca = t.get("created_at")
            print(f"ID: {t.get('_id')} | created_at: {ca} | type: {type(ca)}")
            if ca and not isinstance(ca, datetime):
                print(f"⚠️ NON-DATETIME DETECTED: {ca}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(check_tasks())
