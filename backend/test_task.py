import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

async def test_assign():
    uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DB_NAME", "worksheet_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    print("--- TESTING TASK ASSIGNMENT ---")
    # 1. Find an employee
    emp = await db.Employees.find_one({"role": "admin"})
    if not emp:
        print("No admin employee found to test with.")
        return
    
    emp_id_str = str(emp["_id"])
    proj_id_str = emp.get("project_id")
    
    print(f"Target User: {emp['name']}, ID: {emp_id_str}")
    
    # 2. Create a task via the same logic as the service
    new_task = {
        "title": "Debug Task " + datetime.now().strftime("%H:%M:%S"),
        "description": "System test",
        "assigned_to": emp_id_str,
        "project_id": proj_id_str,
        "status": "Pending",
        "created_at": datetime.utcnow()
    }
    
    res = await db.Tasks.insert_one(new_task)
    print(f"Task created with ID: {res.inserted_id}")
    
    # 3. Simulate the fetch query
    # In EmployeeDetails.jsx: tasks.filter(t => t.assignedTo === id)
    # The formatted task will have "assignedTo": task.get("assigned_to")
    
    fetched = await db.Tasks.find_one({"_id": res.inserted_id})
    print(f"Fetched Task assigned_to: {fetched.get('assigned_to')}")
    print(f"Match logic: {fetched.get('assigned_to') == emp_id_str}")

if __name__ == "__main__":
    asyncio.run(test_assign())
