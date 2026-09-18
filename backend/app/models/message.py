from datetime import datetime, timezone


def create_message_document(
    conversation_id: str,
    role: str,
    content: str,
    sources: list[dict] | None = None,
) -> dict:
    return {
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "sources": sources or [],
        "created_at": datetime.now(timezone.utc),
    }


def serialize_message(
    message: dict,
) -> dict:
    return {
        "id": str(message["_id"]),
        "conversation_id": message["conversation_id"],
        "role": message["role"],
        "content": message["content"],
        "sources": message.get("sources", []),
        "created_at": message["created_at"],
    }