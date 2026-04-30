from app.db.mongo import db
from datetime import datetime
from bson import ObjectId

def format_task(task):
    if not task:
        return None
    return {
        "id": str(task.get("_id")),
        "_id": str(task.get("_id")),
        "title": task.get("title"),
        "description": task.get("description"),
        "deadline": task.get("deadline"),
        "priority": task.get("priority"),
        "status": task.get("status"),
        "timeline": task.get("timeline"),
        "assignedTo": task.get("assigned_to"),
        "assigned_to": task.get("assigned_to"),
        "projectId": task.get("project_id"),
        "project_id": task.get("project_id"),
        "progress": task.get("progress", 0.0),
        "createdAt": task.get("created_at"),
        "created_at": task.get("created_at")
    }

async def recalculate_employee_progress(employee_id: str):
    """
    Calculates progress percentages based on the average of task progress percentages.
    """
    if not employee_id:
        return

    # Fetch all tasks for this employee
    cursor = db.tasks.find({"assigned_to": employee_id})
    all_tasks = await cursor.to_list(length=1000)
    
    if not all_tasks:
        # Reset to 0 if no tasks
        await db.employees.update_one(
            {"_id": ObjectId(employee_id)},
            {"$set": {"work_progress_perc": 0.0, "overall_progress_perc": 0.0}}
        )
        return

    # Filter by timeline
    daily_tasks = [t for t in all_tasks if str(t.get("timeline")).strip().lower() == "daily"]
    weekly_tasks = [t for t in all_tasks if str(t.get("timeline")).strip().lower() == "weekly"]

    def calc_perc(tasks):
        if not tasks: return 0.0
        # Calculate average progress (treat "Completed" status as 100%)
        total_progress = 0.0
        for t in tasks:
            prog = float(t.get("progress", 0.0))
            if t.get("status") == "Completed":
                prog = 100.0
            total_progress += prog
        
        return round(total_progress / len(tasks), 1)

    daily_perc = calc_perc(daily_tasks)
    weekly_perc = calc_perc(weekly_tasks)

    # Update employee document
    await db.employees.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": {
            "work_progress_perc": daily_perc,
            "overall_progress_perc": weekly_perc,
            "updated_at": datetime.utcnow()
        }}
    )
    print(f"📊 AUTO-SYNC: Employee {employee_id} progress updated: Daily {daily_perc}%, Weekly {weekly_perc}%")

async def create_task(task_data: dict):
    """Inserts a new task and triggers progress sync."""
    db_data = {
        "title": task_data.get("title"),
        "description": task_data.get("description"),
        "deadline": task_data.get("deadline"),
        "priority": task_data.get("priority", "Medium"),
        "timeline": task_data.get("timeline", "daily"),
        "status": task_data.get("status", "Pending"),
        "assigned_to": task_data.get("assignedTo") or task_data.get("assigned_to"),
        "project_id": task_data.get("projectId") or task_data.get("project_id"),
        "progress": task_data.get("progress", 0.0),
        "created_at": datetime.utcnow()
    }
    
    result = await db.tasks.insert_one(db_data)
    task_id = result.inserted_id
    
    # 🔥 Trigger Auto-Sync
    if db_data["assigned_to"]:
        await recalculate_employee_progress(db_data["assigned_to"])
        
    db_data["_id"] = task_id
    return format_task(db_data)

async def get_tasks_by_employee(employee_id: str):
    cursor = db.tasks.find({"assigned_to": employee_id}).sort("created_at", -1)
    raw_tasks = await cursor.to_list(length=100)
    return [format_task(t) for t in raw_tasks]

async def update_task_status(task_id: str, new_status: str):
    """Updates task status and triggers progress sync."""
    try:
        # Find the task first to know who it's assigned to
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return None
            
        updated_task = await db.tasks.find_one_and_update(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}},
            return_document=True
        )
        
        # 🔥 Trigger Auto-Sync
        if task.get("assigned_to"):
            await recalculate_employee_progress(task.get("assigned_to"))
            
        return format_task(updated_task)
    except Exception:
        return None

async def update_task_progress(task_id: str, new_progress: float):
    """Updates the progress percentage of a specific task and triggers sync."""
    try:
        # Find the task first to know who it's assigned to
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return None

        updated_task = await db.tasks.find_one_and_update(
            {"_id": ObjectId(task_id)},
            {"$set": {"progress": new_progress, "updated_at": datetime.utcnow()}},
            return_document=True
        )

        # 🔥 Trigger Auto-Sync
        if task.get("assigned_to"):
            await recalculate_employee_progress(task.get("assigned_to"))

        return format_task(updated_task)
    except Exception:
        return None

async def get_tasks_by_project(project_id: str = None):
    query = {}
    if project_id and str(project_id).lower() not in ["null", "undefined", "none", ""]:
        query["project_id"] = str(project_id)
    cursor = db.tasks.find(query).sort("created_at", -1)
    raw_tasks = await cursor.to_list(length=500)
    return [format_task(t) for t in raw_tasks]

async def delete_task(task_id: str):
    """Deletes task and triggers progress sync."""
    # Find task before deletion
    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        return False
        
    result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    
    # 🔥 Trigger Auto-Sync
    if task.get("assigned_to"):
        await recalculate_employee_progress(task.get("assigned_to"))
        
    return result.deleted_count > 0
