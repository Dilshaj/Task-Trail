import asyncio
from app.db.mongo import db
from bson import ObjectId

async def check_employees():
    db.connect()
    print("Connected to DB")
    
    # List all employees and their project_id
    cursor = db.employees.find({})
    employees = await cursor.to_list(length=100)
    
    print(f"Total employees found: {len(employees)}")
    for emp in employees:
        print(f"Name: {emp.get('name')}, project_id: {emp.get('project_id')} (Type: {type(emp.get('project_id'))})")
        
    # Test a sample filter
    if employees:
        sample_pid = employees[0].get('project_id')
        if sample_pid:
            print(f"\nTesting filter for project_id: {sample_pid}")
            p_ids = [str(sample_pid)]
            try:
                p_ids.append(ObjectId(sample_pid))
            except:
                pass
            
            filter_query = {"project_id": {"$in": p_ids}}
            filtered_cursor = db.employees.find(filter_query)
            filtered_employees = await filtered_cursor.to_list(length=100)
            print(f"Found {len(filtered_employees)} employees matching {sample_pid}")
        else:
            print("\nFirst employee has no project_id, cannot test filter.")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(check_employees())
