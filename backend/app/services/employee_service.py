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

    # Get persisted values (defaulting to 0.0 if never set or None)
    work_prog = float(emp.get("work_progress_perc") or 0.0)
    overall_prog = float(emp.get("overall_progress_perc") or 0.0)
    
    def format_date(dt):
        if not dt: return None
        if isinstance(dt, datetime):
            return dt.isoformat()
        return str(dt)

    joining_date_val = format_date(emp.get("joining_date") or emp.get("created_at"))
    
    return {
        "id": str(emp.get("_id")),
        "_id": str(emp.get("_id")),
        "employeeId": emp.get("employee_id"),
        "employee_id": emp.get("employee_id"),
        "name": name if name else "Unknown User",
        "role": emp.get("role") if emp.get("role") else "user",
        "roleType": emp.get("roleType") or emp.get("role_type") or emp.get("role"),
        "domain": emp.get("domain"),
        "email": emp.get("email"),
        "avatar": final_avatar,
        "projectId": str(emp.get("project_id")) if emp.get("project_id") else None,
        "project_id": str(emp.get("project_id")) if emp.get("project_id") else None,
        "projectName": emp.get("projectName") or emp.get("project_name"),
        
        # Mapped to all possible frontend field names for reliability
        "workProgress": work_prog,
        "overallProgress": overall_prog,
        "dailyProgress": work_prog, 
        "weeklyProgress": overall_prog,
        "work_progress_perc": work_prog,
        "overall_progress_perc": overall_prog,
        "manual_progress_override": emp.get("manual_progress_override", False),
        "manualProgressOverride": emp.get("manual_progress_override", False),
        
        "isCheckedIn": emp.get("is_checked_in", False),
        "is_checked_in": emp.get("is_checked_in", False),
        "lastCheckIn": format_date(emp.get("last_check_in")),
        "lastCheckOut": format_date(emp.get("last_check_out")),
        "hasFaceEncoding": bool(emp.get("face_encoding")),
        "has_face_encoding": bool(emp.get("face_encoding")),
        
        "createdAt": format_date(emp.get("created_at")),
        "created_at": format_date(emp.get("created_at")),
        "updatedAt": format_date(emp.get("updated_at")),
        "joiningDate": joining_date_val,
        "joining_date": joining_date_val
    }

async def get_employees(skip: int = 0, limit: int = 100, project_id: str = None, domain: str = None):
    """Retrieve employees with strict project-wise isolation and optional domain filtering."""
    if db.db is None:
        return []
    try:
        query = {}
        # Ensure project_id is a valid, non-null string before filtering
        if project_id and str(project_id).lower() not in ["null", "undefined", "none", ""]:
            # Robust Isolation: Match both string and ObjectId formats
            p_ids = [str(project_id)]
            try:
                p_ids.append(ObjectId(project_id))
            except:
                pass
            query["project_id"] = {"$in": p_ids}
            logger.info(f"[ISOLATION] Filtering employees for project_id: {project_id}")
        else:
            # If no project_id is provided, we return ALL employees.
            # This is necessary for the Global Admin Dashboard to show total counts.
            logger.info("[ISOLATION] No project_id provided. Returning all employees.")
        
        if domain and str(domain).lower() not in ["null", "undefined", "none", "all", ""]:
            domain_lower = str(domain).lower().strip()
            if domain_lower == "developers":
                query["role"] = {"$regex": "^(?!.*python)(?!.*design)(?!.*designer)(?!.*uiux)(?!.*ui/ux)(?:.*develop|.*devlop)", "$options": "i"}
            elif domain_lower in ["python developer", "python developers", "python"]:
                query["role"] = {"$regex": "python", "$options": "i"}
            elif domain_lower in ["data analysts", "data analyst", "analysts", "analyst"]:
                query["role"] = {"$regex": "analyst", "$options": "i"}
            elif domain_lower == "devops":
                query["role"] = {"$regex": "devops", "$options": "i"}
            elif domain_lower in ["cyber security", "cybersecurity", "security"]:
                query["role"] = {"$regex": "security", "$options": "i"}
            elif domain_lower in ["uiux design", "ui/ux design", "uiux designer", "ui/ux designer", "uiux", "ui/ux", "design", "designer"]:
                query["role"] = {"$regex": "ui/ux|uiux|design|designer", "$options": "i"}
            elif domain_lower == "others":
                query["role"] = {"$not": {"$regex": "develop|devlop|analyst|devops|security|python|design|designer|uiux|ui/ux", "$options": "i"}}
        
        cursor = db.employees.find(query, {"face_image": 0}).skip(skip).limit(limit)
        raw_employees = await cursor.to_list(length=limit)
        
        # 🛡️ Filter out None values and format safely
        formatted_list = []
        for e in raw_employees:
            if e:
                try:
                    formatted_list.append(format_employee(e))
                except Exception as format_err:
                    logger.error(f"Error formatting employee {e.get('_id')}: {format_err}")
        
        return formatted_list
    except Exception as e:
        logger.error(f"🔥 GET EMPLOYEES ERROR: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return []

async def get_employee_by_id(user_id: str):
    if db.db is None:
        return None
    try:
        emp = await db.employees.find_one({"_id": ObjectId(user_id)})
        return format_employee(emp)
    except Exception as e:
        logger.error(f"Error getting employee by id: {e}")
        return None

async def get_employee_by_employee_id(emp_id: str):
    if db.db is None:
        return None
    try:
        emp = await db.employees.find_one({"employee_id": emp_id})
        return format_employee(emp)
    except Exception as e:
        logger.error(f"Error getting employee by employee id: {e}")
        return None

async def search_employee(employee_id: str = None, name: str = None):
    """Search for an employee by ID or name."""
    if db.db is None:
        return None
    try:
        query = {}
        if employee_id:
            query["employee_id"] = employee_id
        elif name:
            query["name"] = {"$regex": name, "$options": "i"}
        
        emp = await db.employees.find_one(query)
        return format_employee(emp) if emp else None
    except Exception as e:
        logger.error(f"Error searching employee: {e}")
        return None

async def create_employee(employee: EmployeeCreate):
    if db.db is None:
        return None
    try:
        new_emp_data = employee.model_dump()
        
        # 🔒 RBAC Guard: TEAM_LEAD must have a project_id
        if new_emp_data.get("role") == "TEAM_LEAD" and not new_emp_data.get("project_id"):
            raise ValueError("TEAM_LEAD must be assigned to a project_id")
        if new_emp_data.get("role") == "TEAM_LEAD":
            new_emp_data["roleType"] = "TEAM_LEAD"

        # 🔒 RBAC Guard: DOMAIN_LEAD must have project and domain
        if new_emp_data.get("role") == "DOMAIN_LEAD":
            if not new_emp_data.get("project_id"):
                raise ValueError("DOMAIN_LEAD must be assigned to a project_id")
            if not new_emp_data.get("domain"):
                raise ValueError("DOMAIN_LEAD must be assigned to a domain")
            new_emp_data["roleType"] = "DOMAIN_LEAD"
            
        # Default password if not provided
        password = new_emp_data.pop("password", None) or "user"
        new_emp_data["password_hash"] = get_password_hash(password)
        
        new_emp_data["created_at"] = datetime.utcnow()
        new_emp_data["updated_at"] = datetime.utcnow()
        new_emp_data["work_progress_perc"] = 0.0
        new_emp_data["overall_progress_perc"] = 0.0
        
        if "email" not in new_emp_data or not new_emp_data["email"]:
            new_emp_data["email"] = f"{new_emp_data['employee_id']}@worksheet.local"

        if new_emp_data.get("project_id") and not new_emp_data.get("projectName"):
            try:
                proj = await db.projects.find_one({"_id": ObjectId(str(new_emp_data["project_id"]))})
                if proj:
                    new_emp_data["projectName"] = proj.get("name")
            except Exception:
                pass
        
        result = await db.employees.insert_one(new_emp_data)
        new_emp_data["_id"] = result.inserted_id
        return format_employee(new_emp_data)
    except Exception as e:
        logger.error(f"Error creating employee: {e}")
        if isinstance(e, ValueError):
            raise e
        return None

async def update_employee_progress(user_id: str, progress: EmployeeProgressUpdate):
    """Persist the manual slider updates to MongoDB and set override flag."""
    if db.db is None:
        return None
    try:
        update_data = {
            "work_progress_perc": float(progress.work_progress_perc),
            "overall_progress_perc": float(progress.overall_progress_perc),
            "manual_progress_override": True, # 🔥 Prevent auto-sync from overwriting this
            "updated_at": datetime.utcnow()
        }
        
        # 🛡️ Robust Match: Try ObjectId then employee_id
        query = {"$or": [{"employee_id": user_id}]}
        try:
            query["$or"].append({"_id": ObjectId(user_id)})
        except:
            pass
            
        await db.employees.update_one(query, {"$set": update_data})
        logger.info(f"✅ PERSISTED Manual Progress for {user_id}: {update_data}")
        return await get_employee_by_id(user_id) or await get_employee_by_employee_id(user_id)
    except Exception as e:
        logger.error(f"Error updating employee progress: {e}")
        return None

async def assign_employee_project(user_id: str, project_id: str):
    if db.db is None:
        return None
    try:
        await db.employees.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"project_id": project_id, "updated_at": datetime.utcnow()}}
        )
        return await get_employee_by_id(user_id)
    except Exception as e:
        logger.error(f"Error assigning employee project: {e}")
        return None

async def update_employee(user_id: str, employee_update):
    if db.db is None:
        return None
    try:
        update_data = employee_update.model_dump(exclude_unset=True)
        
        # Hash password if updated
        if "password" in update_data and update_data["password"]:
            update_data["password_hash"] = get_password_hash(update_data.pop("password"))
        elif "password" in update_data:
            update_data.pop("password")
            
        update_data["updated_at"] = datetime.utcnow()
        
        # Ensure TEAM_LEAD has project_id if role is changing to TEAM_LEAD
        if update_data.get("role") == "TEAM_LEAD" and not update_data.get("project_id"):
            # Check existing project_id
            existing = await db.employees.find_one({"_id": ObjectId(user_id)})
            if not existing.get("project_id"):
                raise ValueError("TEAM_LEAD must be assigned to a project_id")

        await db.employees.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        return await get_employee_by_id(user_id)
    except Exception as e:
        logger.error(f"Error updating employee: {e}")
        if isinstance(e, ValueError):
            raise e
        return None

async def delete_employee(user_id: str):
    """
    Deletes an employee. 
    Resilient: Tries to delete by MongoDB _id (ObjectId) OR human-readable employee_id.
    """
    if db.db is None:
        return False
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
