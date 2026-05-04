from app.db.mongo import db
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

def format_task(task):
    if not task:
        return None
        
    try:
        # Ensure all ID fields are strings for Pydantic/Frontend consistency
        return {
            "id": str(task.get("_id")),
            "_id": str(task.get("_id")),
            "title": task.get("title"),
            "description": task.get("description"),
            "deadline": task.get("deadline"),
            "priority": task.get("priority", "Medium"),
            "status": task.get("status", "Pending"),
            "timeline": task.get("timeline", "daily"),
            "assignedTo": str(task.get("assigned_to")) if task.get("assigned_to") else None,
            "assigned_to": str(task.get("assigned_to")) if task.get("assigned_to") else None,
            "projectId": str(task.get("project_id")) if task.get("project_id") else None,
            "project_id": str(task.get("project_id")) if task.get("project_id") else None,
            "progress": float(task.get("progress", 0.0)) if task.get("progress") is not None else 0.0,
            "createdAt": task.get("created_at"),
            "created_at": task.get("created_at")
        }
    except Exception as e:
        logger.error(f"❌ Error formatting task {task.get('_id')}: {e}")
        return None

async def recalculate_employee_progress(employee_id: str):
    """
    Calculates progress percentages based on the average of task progress percentages.
    """
    if not employee_id or not db.db:
        return

    try:
        # 1. Fetch the employee to check for manual override flag
        query = {"$or": [{"employee_id": employee_id}]}
        try: query["$or"].append({"_id": ObjectId(employee_id)})
        except: pass
        
        emp = await db.employees.find_one(query)
        if emp and emp.get("manual_progress_override") is True:
            logger.info(f"⏭️ Skipping auto-sync for {employee_id} (Manual Override Active)")
            return

        # 2. Fetch all tasks for this employee
        cursor = db.tasks.find({"assigned_to": employee_id})
        all_tasks = await cursor.to_list(length=1000)
        
        if not all_tasks:
            # Reset to 0 if no tasks
            await db.employees.update_one(
                query,
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
                raw_prog = t.get("progress", 0.0)
                try:
                    prog = float(raw_prog)
                except (ValueError, TypeError):
                    prog = 0.0
                    
                if t.get("status") == "Completed":
                    prog = 100.0
                total_progress += prog
            
            return round(total_progress / len(tasks), 1)

        daily_perc = calc_perc(daily_tasks)
        weekly_perc = calc_perc(weekly_tasks)

        await db.employees.update_one(
            query,
            {"$set": {
                "work_progress_perc": daily_perc,
                "overall_progress_perc": weekly_perc,
                "updated_at": datetime.utcnow()
            }}
        )
        print(f"📊 AUTO-SYNC: Employee {employee_id} progress updated: Daily {daily_perc}%, Weekly {weekly_perc}%")
    except Exception as e:
        logger.error(f"Error recalculating progress: {e}")

async def create_task(task_data: dict):
    """Inserts a new task and triggers progress sync."""
    print(f"DEBUG: create_task called with {task_data}")
    if db.db is None:
        logger.error("❌ CREATE TASK ERROR: Database connection is None")
        print("DEBUG: db.db is None")
        return None
    try:
        logger.info(f"📝 Creating task with data: {task_data}")
        print("DEBUG: Constructing db_data")
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
        
        logger.info(f"📤 Inserting into MongoDB: {db_data}")
        print(f"DEBUG: Inserting into {db.tasks.name}")
        result = await db.tasks.insert_one(db_data)
        task_id = result.inserted_id
        logger.info(f"✅ Task inserted with ID: {task_id}")
        
        # 🔥 Trigger Auto-Sync (Wrapped in try-except so it doesn't block task creation)
        if db_data["assigned_to"]:
            try:
                logger.info(f"🔄 Triggering progress sync for employee: {db_data['assigned_to']}")
                await recalculate_employee_progress(db_data["assigned_to"])
            except Exception as sync_err:
                logger.error(f"⚠️ Auto-sync failed but task was created: {sync_err}")
            
        db_data["_id"] = task_id
        return format_task(db_data)
    except Exception as e:
        logger.error(f"❌ CRITICAL ERROR IN create_task: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None

async def get_tasks_by_employee(employee_id: str):
    if db.db is None:
        return []
    try:
        cursor = db.tasks.find({"assigned_to": employee_id}).sort("created_at", -1)
        raw_tasks = await cursor.to_list(length=100)
        return [format_task(t) for t in raw_tasks]
    except Exception as e:
        logger.error(f"Error getting tasks by employee: {e}")
        return []

async def update_task_status(task_id: str, new_status: str):
    """Updates task status and triggers progress sync."""
    if db.db is None:
        return None
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
    except Exception as e:
        logger.error(f"Error updating task status: {e}")
        return None

async def update_task_progress(task_id: str, new_progress: float):
    """Updates the progress percentage of a specific task and triggers sync."""
    if db.db is None:
        return None
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
    except Exception as e:
        logger.error(f"Error updating task progress: {e}")
        return None

async def get_tasks_by_project(project_id: str = None):
    """Retrieve tasks with strict project-wise isolation."""
    if db.db is None:
        return []
    try:
        query = {}
        if project_id and str(project_id).lower() not in ["null", "undefined", "none", ""]:
            # Robust Isolation: Match both string and ObjectId formats
            pids = [str(project_id)]
            try:
                pids.append(ObjectId(project_id))
            except:
                pass
            query["project_id"] = {"$in": pids}
        else:
            # If no project_id is provided, we return ALL tasks.
            # This is necessary for the Global Admin Dashboard to show total counts.
            pass
            
        cursor = db.tasks.find(query).sort("created_at", -1)
        raw_tasks = await cursor.to_list(length=500)
        
        # Filter out None values from failed formatting
        formatted_tasks = []
        for t in raw_tasks:
            formatted = format_task(t)
            if formatted:
                formatted_tasks.append(formatted)
        
        return formatted_tasks
    except Exception as e:
        logger.error(f"🔥 GET TASKS ERROR: {str(e)}")
        return []

async def delete_task(task_id: str):
    """Deletes task and triggers progress sync."""
    if db.db is None:
        return False
    try:
        # Find task before deletion
        task = await db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return False
            
        result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
        
        # 🔥 Trigger Auto-Sync
        if task.get("assigned_to"):
            await recalculate_employee_progress(task.get("assigned_to"))
            
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        return False
