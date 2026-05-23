from app.db.mongo import db
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

async def create_notification(employee_id: str, message: str, notification_type: str):
    """Saves a notification in MongoDB."""
    if db.db is None:
        logger.error("[NOTIFICATION SERVICE] Database not connected.")
        return None
        
    notification = {
        "employee_id": employee_id,
        "message": message,
        "type": notification_type,
        "read": False,
        "created_at": datetime.utcnow()
    }
    try:
        result = await db.notifications.insert_one(notification)
        logger.info(f"[NOTIFICATION CREATED] For {employee_id}: {message}")
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"[NOTIFICATION ERROR] {e}")
        return None

async def get_unread_notifications(employee_id: str):
    """Fetch unread notifications for a specific employee."""
    if db.db is None:
        return []
    try:
        cursor = db.notifications.find({"employee_id": employee_id, "read": False}).sort("created_at", -1)
        notifications = await cursor.to_list(length=50)
        for n in notifications:
            n["id"] = str(n["_id"])
        return notifications
    except Exception as e:
        logger.error(f"[NOTIFICATION FETCH ERROR] {e}")
        return []

async def mark_as_read(notification_id: str):
    """Mark a notification as read."""
    if db.db is None:
        return False
    try:
        await db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {"read": True}}
        )
        return True
    except Exception as e:
        logger.error(f"[NOTIFICATION UPDATE ERROR] {e}")
        return False
