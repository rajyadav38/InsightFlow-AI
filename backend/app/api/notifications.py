
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import database

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


@router.get("")
async def get_notifications(
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    notifications = await database.notifications.find(
        {"user_id": user_id}
    ).sort("created_at", -1).to_list(length=50)

    unread_count = await database.notifications.count_documents(
        {"user_id": user_id, "read": False}
    )

    return {
        "notifications": [
            {
                "id": str(item["_id"]),
                "title": item["title"],
                "message": item["message"],
                "type": item.get("type", "info"),
                "project_id": item.get("project_id"),
                "source_id": item.get("source_id"),
                "read": item.get("read", False),
                "created_at": item["created_at"],
            }
            for item in notifications
        ],
        "unread_count": unread_count,
    }


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await database.notifications.update_one(
        {
            "_id": ObjectId(notification_id),
            "user_id": str(current_user["_id"]),
        },
        {
            "$set": {
                "read": True,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification marked as read"}


@router.patch("/read-all")
async def mark_all_notifications_read(
    current_user=Depends(get_current_user),
):
    result = await database.notifications.update_many(
        {
            "user_id": str(current_user["_id"]),
            "read": False,
        },
        {
            "$set": {
                "read": True,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {
        "message": "All notifications marked as read",
        "updated_count": result.modified_count,
    }


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")

    result = await database.notifications.delete_one(
        {
            "_id": ObjectId(notification_id),
            "user_id": str(current_user["_id"]),
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
