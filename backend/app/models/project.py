from datetime import datetime, timezone


def create_project_document(
    user_id: str,
    name: str,
    description: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc)

    return {
        "user_id": user_id,
        "name": name,
        "description": description,
        "created_at": now,
        "updated_at": now,
    }


def serialize_project(project: dict) -> dict:
    return {
        "id": str(project["_id"]),
        "name": project["name"],
        "description": project.get("description"),
        "created_at": project["created_at"],
        "updated_at": project["updated_at"],
    }