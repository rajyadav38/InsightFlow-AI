from datetime import datetime, timezone


def create_source_document(
    project_id: str,
    user_id: str,
    source_type: str,
    title: str,
    url: str | None = None,
    filename: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc)

    return {
        "project_id": project_id,
        "user_id": user_id,
        "type": source_type,
        "title": title,
        "url": url,
        "filename": filename,
        "status": "pending",
        "chunk_count": 0,
        "created_at": now,
        "updated_at": now,
    }


def serialize_source(source: dict) -> dict:
    return {
        "id": str(source["_id"]),
        "project_id": source["project_id"],
        "type": source["type"],
        "title": source["title"],
        "url": source.get("url"),
        "filename": source.get("filename"),
        "status": source.get("status", "pending"),
        "chunk_count": source.get("chunk_count", 0),
        "created_at": source["created_at"],
        "updated_at": source["updated_at"],
    }