from datetime import datetime, timezone, timedelta
from app.db.mongo import db
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

def get_current_timestamps():
    """Returns today's date in IST and a clean UTC ISO string."""
    now_utc = datetime.now(timezone.utc)
    now_ist = now_utc + timedelta(hours=5, minutes=30)
    return now_ist.strftime("%Y-%m-%d"), now_utc.isoformat().replace("+00:00", "Z")

def format_attendance(log):
    if not log:
        return None
    
    check_in = log.get("check_in")
    check_out = log.get("check_out")
    
    return {
        "id": str(log.get("_id")),
        "employeeId": log.get("employee_id"),
        "userName": log.get("userName"),
        "userId": log.get("userId"),
        "projectId": log.get("projectId"), # 🚀 Key fix for dashboard visibility
        "date": log.get("date"),
        "checkInTime": check_in,
        "checkIn": check_in,
        "check_in": check_in,
        "checkOutTime": check_out,
        "checkOut": check_out,
        "check_out": check_out,
        "latitude": log.get("latitude"),
        "longitude": log.get("longitude"),
        "locationName": log.get("location_name"),
        "status": "Checked In" if not check_out else "Logged Out"
    }

async def get_all_attendance(skip: int = 0, limit: int = 100, project_id: str = None):
    """Fetches all logs from MongoDB with optimized batch user lookup."""
    try:
        query = {}
        
        if project_id and project_id != 'null':
            # 🛡️ Resilient Lookup: Find all employees in this project + all Admins
            pids = [project_id]
            try: pids.append(ObjectId(project_id))
            except: pass
            
            target_users = await db.employees.find({
                "$or": [
                    {"project_id": {"$in": pids}},
                    {"role": {"$in": ["admin", "Super Admin", "Management"]}}
                ]
            }).to_list(1000)
            
            emp_ids = [u["employee_id"] for u in target_users]
            query["employee_id"] = {"$in": emp_ids}
            logger.info(f"📊 [ATTENDANCE] project_id={project_id} -> Filtered to {len(emp_ids)} users")

        # 1. Fetch logs
        cursor = db.attendance.find(query).sort([("date", -1), ("created_at", -1)]).skip(skip).limit(limit)
        logs = await cursor.to_list(limit)
        
        if not logs:
            return []

        # 2. 🚀 OPTIMIZATION: Batch Fetch Users to prevent N+1 Timeouts
        unique_emp_ids = list(set([l["employee_id"] for l in logs]))
        users_raw = await db.employees.find({"employee_id": {"$in": unique_emp_ids}}).to_list(len(unique_emp_ids))
        user_map = {u["employee_id"]: u for u in users_raw}

        # 3. Format and enrich
        formatted_logs = []
        for log in logs:
            user = user_map.get(log["employee_id"])
            if user:
                log["userName"] = user.get("name", "Unknown Worker")
                log["userId"] = str(user.get("_id"))
                log["projectId"] = user.get("project_id")
            else:
                log["userName"] = "Unknown Worker"
                log["userId"] = None
                log["projectId"] = None
            
            formatted_logs.append(format_attendance(log))
        
        logger.info(f"✅ [ATTENDANCE] Returning {len(formatted_logs)} logs")
        return formatted_logs

    except Exception as e:
        logger.error(f"🔥 [ATTENDANCE] CRITICAL ERROR: {str(e)}")
        # Return empty list instead of crashing with 500 if it's a minor error
        return []

async def get_active_checkin(employee_id: str, current_date: str):
    """Uses find_one to locate today's unfinished session."""
    return await db.attendance.find_one({
        "employee_id": employee_id,
        "date": current_date,
        "check_out": None
    })

async def check_in(employee_id: str, latitude: float = None, longitude: float = None, location_name: str = None):
    """Uses insert_one to create a new attendance log."""
    current_date, current_time = get_current_timestamps()
    
    status = await get_active_checkin(employee_id, current_date)
    if status:
        user = await db.employees.find_one({"employee_id": employee_id})
        status["userName"] = user.get("name") if user else "Unknown"
        status["userId"] = str(user.get("_id")) if user else None
        return format_attendance(status), False

    user = await db.employees.find_one({"employee_id": employee_id})
    project_id = user.get("project_id") if user else None

    new_log = {
        "employee_id": employee_id,
        "date": current_date,
        "check_in": current_time,
        "check_out": None,
        "latitude": latitude,
        "longitude": longitude,
        "location_name": location_name,
        "project_id": project_id,
        "created_at": datetime.utcnow()
    }

    result = await db.attendance.insert_one(new_log)
    new_log["_id"] = result.inserted_id
    
    new_log["userName"] = user.get("name") if user else "Unknown"
    new_log["userId"] = str(user.get("_id")) if user else None
    new_log["projectId"] = project_id
    
    return format_attendance(new_log), True

async def check_out(employee_id: str):
    """Uses update_one to close an active check-in session for today."""
    current_date, current_time = get_current_timestamps()

    result = await db.attendance.update_one(
        {
            "employee_id": employee_id, 
            "date": current_date, 
            "check_out": None
        },
        {"$set": {"check_out": current_time}}
    )

    if result.modified_count > 0:
        updated_log = await db.attendance.find_one({
            "employee_id": employee_id, 
            "date": current_date, 
            "check_out": current_time
        })
        
        user = await db.employees.find_one({"employee_id": employee_id})
        updated_log["userName"] = user.get("name") if user else "Unknown"
        updated_log["userId"] = str(user.get("_id")) if user else None
        
        return format_attendance(updated_log)
    
    return None
