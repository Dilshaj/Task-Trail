import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def main():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "eduprova")
    print(f"Connecting to {uri} ...")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    email = "dilshajceo@dilshajinfotech.tech"
    user = await db.employees.find_one({"email": email})
    
    if user:
        print(f"✅ FOUND USER: {user.get('email')}")
        print(f"🆔 ROLE: {user.get('role')}")
        print(f"🔑 HASH: {user.get('password_hash')[:20]}...")
    else:
        print(f"❌ USER NOT FOUND in {db_name}.employees")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
