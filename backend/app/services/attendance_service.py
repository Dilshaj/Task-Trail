from datetime import datetime, timezone, timedelta
from app.db.mongo import db
from bson import ObjectId
import logging
import json
import pandas as pd
import io
import math
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
        "projectId": str(log.get("project_id")) if log.get("project_id") else (str(log.get("projectId")) if log.get("projectId") else None),
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
        logger.warning(f"[ATTENDANCE] Primary IP lookup failed for {ip_address}: {exc}")
        
    # Secondary Fallback
    try:
        url = f"http://ip-api.com/json/{ip_address}"
        req = Request(url, headers={"User-Agent": "EduProva/1.0"})
        with urlopen(req, timeout=6) as response:
            payload = json.loads(response.read().decode("utf-8"))
        if payload.get("status") == "success":
            lat = _safe_float(payload.get("lat"))
            lng = _safe_float(payload.get("lon"))
            return lat, lng
    except Exception as exc:
        logger.warning(f"[ATTENDANCE] Secondary IP lookup failed for {ip_address}: {exc}")
        
    return None, None

def _calculate_euclidean_distance(v1: list, v2: list) -> float:
    """Calculates the Euclidean distance between two vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return float('inf')
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))

async def get_all_attendance(skip: int = 0, limit: int = 100, project_id: str = None, employee_id: str = None):
    """Fetches all logs from MongoDB with strict project isolation."""
    if db.db is None:
        return []
    try:
        query = {}
        
        if employee_id:
            emp_id_clean = str(employee_id).strip()
            # Support both string and integer IDs just in case
            id_variants = [emp_id_clean]
            try:
                id_variants.append(int(emp_id_clean))
            except:
                pass
            query["employee_id"] = {"$in": id_variants}
            logger.info(f"[ATTENDANCE] Querying with variants: {id_variants}")
        elif project_id and str(project_id).lower() not in ["null", "undefined", "none", ""]:
            # Direct Project Isolation: Only show logs belonging to this project
            pids = [str(project_id)]
            try: pids.append(ObjectId(project_id))
            except: pass
            
            query["project_id"] = {"$in": pids}
            logger.info(f"[ATTENDANCE] Filtering logs strictly for project_id: {project_id}")
        else:
            # Global Admin View: Return ALL logs if no project_id is specified
            logger.info("[ATTENDANCE] No project_id/employee_id provided. Returning ALL logs for Admin view.")

        # 1. Fetch logs
        logger.info(f"[ATTENDANCE] Final Query: {query}")
        cursor = db.attendance.find(query).sort([("date", -1), ("created_at", -1)]).skip(skip).limit(limit)
        logs = await cursor.to_list(limit)
        logger.info(f"[ATTENDANCE] Found {len(logs)} raw logs for query: {query}")
        
        if not logs:
            return []

        # OPTIMIZATION: Batch Fetch Users to prevent N+1 Timeouts
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
        
        logger.info(f"[ATTENDANCE] Returning {len(formatted_logs)} logs")
        return formatted_logs

    except Exception as e:
        logger.error(f"[ATTENDANCE] CRITICAL ERROR: {str(e)}")
        # Return empty list instead of crashing with 500 if it's a minor error
        return []

async def get_active_checkin(employee_id: str, current_date: str = None):
    """Uses find_one to locate an unfinished session. If date is provided, matches today's session."""
    if db.db is None:
        return None
    try:
        query = {
            "employee_id": employee_id,
            "check_out": None
        }
        if current_date:
            query["date"] = current_date
            
        return await db.attendance.find_one(query)
    except Exception as e:
        logger.error(f"Error getting active checkin: {e}")
        return None

async def get_employee_status(employee_id: str):
    """Returns the current attendance status for an employee."""
    if db.db is None:
        return {"is_checked_in": False}
    try:
        current_date, _ = get_current_timestamps()
        active = await get_active_checkin(employee_id, current_date)
        
        if active:
            return {
                "is_checked_in": True,
                "active_log": format_attendance(active)
            }
        return {"is_checked_in": False}
    except Exception as e:
        logger.error(f"Error fetching status: {e}")
        return {"is_checked_in": False}

async def check_in(
    employee_id: str,
    latitude: float = None,
    longitude: float = None,
    location_name: str = None,
    location_source: str = None,
    location_accuracy: float = None,
    face_descriptor: list = None,
    request_meta: dict = None
):
    """
    Strict Check-In:
    1. Time must be between 8:00 AM and 7:00 PM IST.
    2. GPS coordinates (lat/lng) are MANDATORY.
    3. IP-based fallback is disabled.
    """
    if db.db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        # Time Check (IST: UTC+5:30)
        now_utc = datetime.now(timezone.utc)
        now_ist = now_utc + timedelta(hours=5, minutes=30)
        current_hour = now_ist.hour
        
        if current_hour < 8:
            raise HTTPException(
                status_code=400, 
                detail="Check-in not started. Standard check-in time begins at 8:00 AM."
            )
        if current_hour >= 19:
            raise HTTPException(
                status_code=400, 
                detail="Check-in is blocked after 7:00 PM."
            )

        current_date, current_time = get_current_timestamps()
        lat = _safe_float(latitude)
        lng = _safe_float(longitude)
        accuracy = _safe_float(location_accuracy)
        source = location_source or "gps"

        # Mandatory GPS Check (No IP Fallback)
        if lat is None or lng is None:
            logger.warning(f"REJECTED CHECK-IN: Employee {employee_id} attempted check-in without GPS.")
            raise HTTPException(
                status_code=400, 
                detail="Location permission is required to check in. Please enable GPS."
            )

        # 3. Reverse Geocode to get a human-readable address
        resolved_location_name = _reverse_geocode(lat, lng)
        
        # 3. Logging
        logger.info(
            f"[ATTENDANCE] Check-in source={source} employee={employee_id} "
            f"lat={lat} lng={lng} accuracy={accuracy} address='{resolved_location_name}'"
        )
        
        # 4. Face Verification (STRICT)
        user = await db.employees.find_one({"employee_id": employee_id})
        if not user:
            raise HTTPException(status_code=404, detail="Employee record not found")

        stored_encoding = user.get("face_encoding")
        
        if not stored_encoding:
            logger.warning(f"REJECTED CHECK-IN: Employee {employee_id} has no registered face.")
            raise HTTPException(
                status_code=403,
                detail="Face not registered. Please go to Profile and register your face first."
            )
            
        if not face_descriptor:
            logger.warning(f"REJECTED CHECK-IN: Employee {employee_id} provided no face capture.")
            raise HTTPException(
                status_code=400,
                detail="Face verification is mandatory for check-in."
            )

        # Compare descriptors
        distance = _calculate_euclidean_distance(face_descriptor, stored_encoding)
        logger.info(f"[FACE AUTH] Employee {employee_id} distance: {distance:.4f}")

        if distance > 0.6:
            logger.warning(f"REJECTED CHECK-IN: Face mismatch for {employee_id} (distance={distance:.4f})")
            raise HTTPException(
                status_code=401,
                detail="Face not recognized. Please ensure your face is clearly visible and try again."
            )

        logger.info(f"✅ [FACE AUTH SUCCESS] Employee {employee_id} verified.")

        # 5. Check for existing active check-in
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
            logger.info(f"[ATTENDANCE] Updated active check-in location employee={employee_id} source={source}")
            return format_attendance(status), False

            return format_attendance(status), False

        project_id = user.get("project_id")

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
        
        # Sync status to Employee record
        await db.employees.update_one(
            {"employee_id": employee_id},
            {"$set": {"is_checked_in": True, "last_check_in": current_time}}
        )
        
        return format_attendance(new_log), True
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during check-in: {e}")
        raise HTTPException(status_code=500, detail="Failed to check in")

async def check_out(employee_id: str):
    """Uses update_one to close an active check-in session for today."""
    if db.db is None:
        return None
    try:
        current_date, current_time = get_current_timestamps()

        result = await db.attendance.update_one(
            {
                "employee_id": employee_id, 
                "date": current_date, 
                "check_out": None
            },
            {"$set": {"check_out": current_time}}
        )

        # Sync status to Employee record
        await db.employees.update_one(
            {"employee_id": employee_id},
            {"$set": {"is_checked_in": False, "last_check_out": current_time}}
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
    except Exception as e:
        logger.error(f"Error during check-out: {e}")
        return None

async def export_attendance_to_excel(project_id: str = None):
    """Generates an Excel file (in-memory) containing all attendance logs."""
    try:
        # 1. Fetch all logs using existing logic
        logs = await get_all_attendance(limit=10000, project_id=project_id) # Get a large batch
        
        if not logs:
            # Create an empty dataframe with columns if no data
            df = pd.DataFrame(columns=["Employee ID", "Employee Name", "Date", "Check In", "Check Out", "Location", "Source"])
        else:
            # 2. Flatten for Excel
            data = []
            for l in logs:
                data.append({
                    "Employee ID": l.get("employeeId"),
                    "Employee Name": l.get("userName"),
                    "Date": l.get("date"),
                    "Check In": l.get("checkInTime"),
                    "Check Out": l.get("checkOutTime"),
                    "Location": l.get("locationName"),
                    "Source": l.get("locationSource", "Unknown"),
                    "Accuracy (m)": l.get("locationAccuracy")
                })
            df = pd.DataFrame(data)

        # 3. Create Excel in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Attendance Report')
            
            # 4. Auto-adjust columns width for better readability
            worksheet = writer.sheets['Attendance Report']
            for idx, col in enumerate(df.columns):
                # Calculate max length of content in this column
                content_max = df[col].astype(str).map(len).max() if not df[col].empty else 0
                max_len = max(content_max, len(col)) + 5 # Extra padding
                
                # Column A is index 0, B is 1, etc.
                col_letter = chr(65 + idx)
                worksheet.column_dimensions[col_letter].width = min(max_len, 60)
                
                # Special case: Make sure Date column is wide enough for Excel dates
                if "Date" in col:
                    worksheet.column_dimensions[col_letter].width = 20

        output.seek(0)
        return output
    except Exception as e:
        logger.error(f"[EXPORT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate Excel report")
