from datetime import datetime, timezone, timedelta
from app.db.mongo import db
from bson import ObjectId
import logging
import json
from urllib.request import Request, urlopen
from fastapi import HTTPException

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
        "locationSource": log.get("location_source"),
        "locationAccuracy": log.get("location_accuracy"),
        "status": "Checked In" if not check_out else "Logged Out"
    }

def _safe_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None

def _reverse_geocode(latitude: float, longitude: float) -> str:
    """Converts coordinates into a human-readable address."""
    try:
        url = (
            "https://nominatim.openstreetmap.org/reverse"
            f"?lat={latitude}&lon={longitude}&format=jsonv2&addressdetails=1"
        )
        req = Request(url, headers={"User-Agent": "EduProva/1.0"})
        with urlopen(req, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return payload.get("display_name") or "Location Captured"
    except Exception as exc:
        logger.warning(f"[ATTENDANCE] Reverse geocode failed: {exc}")
        return "Location Captured"

def _resolve_ip_from_request_meta(request_meta: dict) -> str:
    forwarded = request_meta.get("x_forwarded_for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request_meta.get("client_ip")

def _ip_lookup(ip_address: str) -> tuple:
    """Returns (latitude, longitude) from IP. Used only when GPS is unavailable."""
    if not ip_address:
        return None, None
    try:
        url = f"https://ipapi.co/{ip_address}/json/"
        req = Request(url, headers={"User-Agent": "EduProva/1.0"})
        with urlopen(req, timeout=6) as response:
            payload = json.loads(response.read().decode("utf-8"))
        lat = _safe_float(payload.get("latitude"))
        lng = _safe_float(payload.get("longitude"))
        return lat, lng
    except Exception as exc:
        logger.warning(f"[ATTENDANCE] IP lookup failed for {ip_address}: {exc}")
        return None, None

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

async def check_in(
    employee_id: str,
    latitude: float = None,
    longitude: float = None,
    location_name: str = None,
    location_source: str = None,
    location_accuracy: float = None,
    request_meta: dict = None
):
    """Uses insert_one to create a new attendance log with GPS-first, IP-fallback logic."""
    current_date, current_time = get_current_timestamps()
    lat = _safe_float(latitude)
    lng = _safe_float(longitude)
    accuracy = _safe_float(location_accuracy)
    source = location_source or "gps"

    # 1. 📍 GPS Logic: If coordinates are missing, try IP fallback
    if lat is None or lng is None:
        logger.info(f"📍 [ATTENDANCE] No GPS coordinates provided for {employee_id}. Falling back to IP.")
        ip_addr = _resolve_ip_from_request_meta(request_meta or {})
        lat, lng = _ip_lookup(ip_addr)
        source = "ip"
        accuracy = None # IP accuracy is unknown/broad
        
        if lat is None or lng is None:
            logger.error(f"❌ [ATTENDANCE] Both GPS and IP lookup failed for {employee_id}")
            raise HTTPException(
                status_code=400, 
                detail="Unable to determine location. Please enable GPS or check your internet connection."
            )

    # 2. 🌍 Reverse Geocode to get a human-readable address
    resolved_location_name = _reverse_geocode(lat, lng)
    
    # 3. 📝 Logging
    logger.info(
        f"✅ [ATTENDANCE] Check-in source={source} employee={employee_id} "
        f"lat={lat} lng={lng} accuracy={accuracy} address='{resolved_location_name}'"
    )
    
    # 4. 🗄️ Check for existing active check-in
    status = await get_active_checkin(employee_id, current_date)
    if status:
        # If already checked in, refresh live location in the existing active row.
        await db.attendance.update_one(
            {"_id": status["_id"]},
            {"$set": {
                "latitude": lat,
                "longitude": lng,
                "location_name": resolved_location_name,
                "location_source": source,
                "location_accuracy": accuracy,
                "updated_at": datetime.utcnow()
            }}
        )
        status["latitude"] = lat
        status["longitude"] = lng
        status["location_name"] = resolved_location_name
        status["location_source"] = source
        status["location_accuracy"] = accuracy
        user = await db.employees.find_one({"employee_id": employee_id})
        status["userName"] = user.get("name") if user else "Unknown"
        status["userId"] = str(user.get("_id")) if user else None
        logger.info(f"🔄 [ATTENDANCE] Updated active check-in location employee={employee_id} source={source}")
        return format_attendance(status), False

    user = await db.employees.find_one({"employee_id": employee_id})
    project_id = user.get("project_id") if user else None

    new_log = {
        "employee_id": employee_id,
        "date": current_date,
        "check_in": current_time,
        "check_out": None,
        "latitude": lat,
        "longitude": lng,
        "location_name": resolved_location_name,
        "location_source": source,
        "location_accuracy": accuracy,
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
