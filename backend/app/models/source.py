from datetime import datetime, timezone


def create_source_document(
    project_id: str,
    user_id: str,
    source_type: str,
    title: str,
    url: str | None = None,
    filename: str | None = None,
    storage_path: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc)

    return {
        "project_id": project_id,
        "user_id": user_id,
        "type": source_type,
        "title": title,
        "url": url,
        "filename": filename,

        # Original file in Supabase
        "storage_path": storage_path,

        # Extracted text in Supabase
        "processed_storage_path": None,

        "status": "pending",

        # Will be populated after processing
        "character_count": 0,
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

        "storage_path": source.get("storage_path"),
        "processed_storage_path": source.get(
            "processed_storage_path"
        ),

        "status": source.get("status", "pending"),
        "character_count": source.get(
            "character_count",
            0,
        ),
        "chunk_count": source.get(
            "chunk_count",
            0,
        ),

        "created_at": source["created_at"],
        "updated_at": source["updated_at"],
    }