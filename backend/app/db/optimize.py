import pymongo
from app.db.mongo import db

async def sync_indexes():
    """
    Creates and verifies critical indexes for the application performance.
    """
    if db.db is None:
        print("[DB] Database not initialized. Skipping index sync.")
        return

    print("[DB] Synchronizing MongoDB Indexes...")

    try:
        # 1. Employees: Force unique constraints on IDs and Emails
        await db.employees.create_index([("employee_id", pymongo.ASCENDING)], unique=True)
        await db.employees.create_index([("email", pymongo.ASCENDING)], unique=True)

        # 2. Attendance: Optimized for "Has user checked in today?" and history lists
        # Compound index for employee + date lookups
        await db.attendance.create_index([
            ("employee_id", pymongo.ASCENDING),
            ("date", pymongo.DESCENDING)
        ])
        # Compound index for general sorting (date then created_at)
        await db.attendance.create_index([
            ("date", pymongo.DESCENDING),
            ("created_at", pymongo.DESCENDING)
        ])
        
        # Single index for general sorting fallback
        await db.attendance.create_index([("created_at", pymongo.DESCENDING)])

        # 3. Tasks: Optimized for dashboard filtering and assigned lists
        await db.tasks.create_index([("assigned_to", pymongo.ASCENDING)])
        await db.tasks.create_index([("project_id", pymongo.ASCENDING)])
        await db.tasks.create_index([("status", pymongo.ASCENDING)])

        print("[DB] MongoDB Indexes synchronized successfully.")
    except Exception as e:
        print(f"[DB ERROR] Index Sync Failed: {str(e)}")
