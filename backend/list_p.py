import asyncio
import motor.motor_asyncio

async def main():
    uri = "mongodb+srv://dilshajinfotechit_db_user:nbjFmYIBoWGrfBGe@worksheet-cluster.g7veehh.mongodb.net/?appName=Worksheet-cluster"
    client = motor.motor_asyncio.AsyncIOMotorClient(uri)
    db = client['worksheet_db']
    async for p in db.Projects.find():
        print(f"Name: {p.get('name')}, ID: {p['_id']}, Type: {type(p['_id'])}")

if __name__ == "__main__":
    asyncio.run(main())
