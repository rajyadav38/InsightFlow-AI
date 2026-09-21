from datetime import datetime, timezone


def create_generated_content_document(
    project_id: str,
    user_id: str,
    content_type: str,
    topic: str,
    tone: str,
    instructions: str | None,
    content: str,
    sources: list[dict] | None = None,
) -> dict:
    return {
"project_id": project_id,
"user_id": user_id,
"type": content_type,
"topic": topic,
"tone": tone,
"instructions": instructions,
"content": content,
"sources": sources or [],
"created_at": datetime.now(timezone.utc),
"updated_at": datetime.now(timezone.utc),
}


def serialize_generated_content(
    document: dict,
) -> dict:
    return {
"id": str(document["_id"]),
"project_id": document["project_id"],
"type": document["type"],
"topic": document["topic"],
"tone": document["tone"],
"instructions": document.get("instructions"),
"content": document["content"],
"sources": document.get("sources", []),
"created_at": document["created_at"],
"updated_at": document["updated_at"],
}