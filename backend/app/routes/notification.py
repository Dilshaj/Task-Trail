from fastapi import APIRouter, Depends, HTTPException
from app.services import notification_service
from app.routes.auth import get_current_user
from typing import List
from app.schemas.schemas import NotificationResponse

router = APIRouter(prefix="/notifications")

@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(current_user: dict = Depends(get_current_user)):
    """Retrieve all unread notifications for the logged-in user."""
    return await notification_service.get_unread_notifications(current_user["employee_id"])

@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    success = await notification_service.mark_as_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}
