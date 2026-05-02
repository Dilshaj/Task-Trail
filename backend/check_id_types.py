import asyncio
from app.db.mongo import db

async def check_types():
    db.connect()
    try:
        tasks = await db.tasks.find({}).to_list(10)
        for t in tasks:
            ato = t.get("assigned_to")
            pid = t.get("project_id")
            print(f"Task {t.get('_id')}:")
            print(f"  assigned_to: {ato} ({type(ato)})")
            print(f"  project_id: {pid} ({type(pid)})")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(check_types())
