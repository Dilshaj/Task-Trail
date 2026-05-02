import asyncio
from app.db.mongo import db

async def list_colls():
    db.connect()
    try:
        colls = await db.db.list_collection_names()
        print(f"Collections: {colls}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(list_colls())
