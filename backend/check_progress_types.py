import asyncio
from app.db.mongo import db

async def check_progress():
    db.connect()
    try:
        tasks = await db.tasks.find({}).to_list(1000)
        for t in tasks:
            p = t.get("progress")
            print(f"Task {t['_id']}: progress={p} ({type(p)})")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(check_progress())
