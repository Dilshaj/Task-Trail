import asyncio
from app.db.mongo import db

async def check_missing():
    db.connect()
    try:
        tasks = await db.tasks.find({}).to_list(1000)
        for t in tasks:
            if "assigned_to" not in t: print(f"Task {t['_id']} missing assigned_to")
            if "project_id" not in t: print(f"Task {t['_id']} missing project_id")
            if "title" not in t: print(f"Task {t['_id']} missing title")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(check_missing())
