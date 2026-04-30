from app.db.mongo import db
from app.schemas.schemas import EmployeeCreate, EmployeeProgressUpdate
from app.services.auth_service import get_password_hash
from bson import ObjectId
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

async def calculate_progress_for_employee(obj_id_input, emp_id_str: str = None):
    """
    Utility to calculate progress based on tasks.
    Used for Auto-Sync when tasks change.
    """
    try:
        match_ids = []
        if isinstance(obj_id_input, str):
            match_ids.append(obj_id_input)
            try: match_ids.append(ObjectId(obj_id_input))
            except: pass
        elif isinstance(obj_id_input, ObjectId):
            match_ids.append(obj_id_input)
            match_ids.append(str(obj_id_input))
        if emp_id_str: match_ids.append(emp_id_str)
            
        cursor = db.tasks.find({"assigned_to": {"$in": match_ids}})
        tasks = await cursor.to_list(length=1000)
        
        if not tasks:
            return 0.0, 0.0
            
        def is_completed(status):
            if not status: return False
            s = str(status).strip().lower()
            return s in ["completed", "done", "success", "finished"]
            
        daily_tasks = [t for t in tasks if str(t.get("timeline")).strip().lower() == "daily"]
        weekly_tasks = [t for t in tasks if str(t.get("timeline")).strip().lower() == "weekly"]
        
        def calc_perc(t_list):
            if not t_list: return 0.0
            
            total_progress = 0.0
            for t in t_list:
                status = str(t.get("status", "")).strip().lower()
                prog = float(t.get("progress", 0.0))
                if status in ["completed", "done", "success", "finished"]:
                    prog = 100.0
                total_progress += prog
            
            return round(total_progress / len(t_list), 1)
            
        return calc_perc(daily_tasks), calc_perc(weekly_tasks)
    except Exception as e:
        logger.error(f"Error calculating progress: {e}")
        return 0.0, 0.0

def format_employee(emp):
    """
    Standard formatter that uses PERSISTED data from MongoDB.
    Ensures manual slider updates are preserved.
    """
    if not emp:
        return None
        
    avatar = emp.get("avatar")
    name = emp.get("name", "User")
    
    # 🛡️ CLOUDINARY-ONLY GUARD (Aggressive replacement of broken/local paths)
    is_broken = not avatar or avatar == "" or avatar == "undefined" or avatar == "null" or "/uploads/" in str(avatar)
    is_ghost = "dzvk36pqu" in str(avatar).lower()
    
    if is_broken or is_ghost:
        # Generate dynamic avatar based on the REAL name
        final_avatar = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=random&color=fff&bold=true"
    else:
        final_avatar = avatar

    # Get persisted values (defaulting to 0.0 if never set)
    work_prog = float(emp.get("work_progress_perc", 0.0))
    overall_prog = float(emp.get("overall_progress_perc", 0.0))
    
    return {
        "id": str(emp.get("_id")),
        "_id": str(emp.get("_id")),
        "employeeId": emp.get("employee_id"),
        "employee_id": emp.get("employee_id"),
        "name": name,
        "role": emp.get("role"),
        "email": emp.get("email"),
        "avatar": final_avatar,
        "projectId": emp.get("project_id"),
        "project_id": emp.get("project_id"),
        
        # Mapped to all possible frontend field names for reliability
        "workProgress": work_prog,
        "overallProgress": overall_prog,
        "dailyProgress": work_prog, 
        "weeklyProgress": overall_prog,
        "work_progress_perc": work_prog,
        "overall_progress_perc": overall_prog,
        
        "createdAt": emp.get("created_at"),
        "created_at": emp.get("created_at"),
        "updatedAt": emp.get("updated_at")
    }

async def get_employees(skip: int = 0, limit: int = 100, project_id: str = None):
    """Retrieve employees with PERSISTED progress (allows manual slider sync)."""
    try:
        query = {}
        # Ensure project_id is a valid, non-null string before filtering
        if project_id and str(project_id).lower() not in ["null", "undefined", "none", ""]:
            query["project_id"] = str(project_id)
        
        cursor = db.employees.find(query).skip(skip).limit(limit)
        raw_employees = await cursor.to_list(length=limit)
        return [format_employee(e) for e in raw_employees]
    except Exception as e:
        logger.error(f"🔥 GET EMPLOYEES ERROR: {str(e)}")
        return []

async def get_employee_by_id(user_id: str):
    try:
        emp = await db.employees.find_one({"_id": ObjectId(user_id)})
        return format_employee(emp)
    except Exception:
        return None

async def get_employee_by_employee_id(emp_id: str):
    try:
        emp = await db.employees.find_one({"employee_id": emp_id})
        return format_employee(emp)
    except Exception:
        return None

async def search_employee(employee_id: str = None, name: str = None):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    elif name:
        query["name"] = {"$regex": name, "$options": "i"}
    
    emp = await db.employees.find_one(query)
    return format_employee(emp)

async def create_employee(employee: EmployeeCreate):
    new_emp_data = employee.model_dump()
    new_emp_data["password_hash"] = get_password_hash("user")
    new_emp_data["created_at"] = datetime.utcnow()
    new_emp_data["role"] = "user"
    new_emp_data["work_progress_perc"] = 0.0
    new_emp_data["overall_progress_perc"] = 0.0
    
    result = await db.employees.insert_one(new_emp_data)
    new_emp_data["_id"] = result.inserted_id
    return format_employee(new_emp_data)

async def update_employee_progress(user_id: str, progress: EmployeeProgressUpdate):
    """Persist the manual slider updates to MongoDB."""
    update_data = {
        "work_progress_perc": float(progress.work_progress_perc),
        "overall_progress_perc": float(progress.overall_progress_perc),
        "updated_at": datetime.utcnow()
    }
    
    await db.employees.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    logger.info(f"✅ PERSISTED Progress for {user_id}: {update_data}")
    return await get_employee_by_id(user_id)

async def assign_employee_project(user_id: str, project_id: str):
    await db.employees.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"project_id": project_id, "updated_at": datetime.utcnow()}}
    )
    return await get_employee_by_id(user_id)

async def update_employee(user_id: str, employee_update):
    update_data = employee_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.employees.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    return await get_employee_by_id(user_id)

async def delete_employee(user_id: str):
    """
    Deletes an employee. 
    Resilient: Tries to delete by MongoDB _id (ObjectId) OR human-readable employee_id.
    """
    try:
        # 1. Try deleting by MongoDB _id
        try:
            result = await db.employees.delete_one({"_id": ObjectId(user_id)})
            if result.deleted_count > 0:
                return True
        except Exception:
            pass # Not a valid ObjectId or not found by _id
            
        # 2. Try deleting by human-readable employee_id
        result = await db.employees.delete_one({"employee_id": user_id})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting employee {user_id}: {e}")
        return False
