from datetime import datetime, timezone


def create_conversation_document(
    project_id: str,
    user_id: str,
    title: str = "New Chat",
) -> dict:
    now = datetime.now(timezone.utc)

    return {
        "project_id": project_id,
        "user_id": user_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
    }


def serialize_conversation(
    conversation: dict,
) -> dict:
    return {
        "id": str(conversation["_id"]),
        "project_id": conversation["project_id"],
        "title": conversation["title"],
        "created_at": conversation["created_at"],
        "updated_at": conversation["updated_at"],
    }