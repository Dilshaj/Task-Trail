import asyncio
from dotenv import load_dotenv
from app.db.mongo import db

async def run():
    db.connect()
    
    print("--- EMPLOYEES ---")
    emp_cursor = db.employees.find({})
    async for emp in emp_cursor:
        print(emp.get("name"), "=>", emp.get("avatar"))

    print("--- PROJECTS ---")
    proj_cursor = db.projects.find({})
    async for proj in proj_cursor:
        print(proj.get("name"), "=> image:", proj.get("image"), " image_url:", proj.get("image_url"))

    db.close()

if __name__ == "__main__":
    asyncio.run(run())
