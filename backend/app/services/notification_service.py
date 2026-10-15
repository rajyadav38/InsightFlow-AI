
from datetime import datetime, timezone

from app.db.database import database


async def create_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = "info",
    project_id: str | None = None,
    source_id: str | None = None,
):
    now = datetime.now(timezone.utc)

    document = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,
        "project_id": project_id,
        "source_id": source_id,
        "read": False,
        "created_at": now,
        "updated_at": now,
    }

    await database.notifications.insert_one(document)
