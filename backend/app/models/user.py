from datetime import datetime, timezone

from bson import ObjectId


def create_user_document(
    name: str,
    email: str,
    password_hash: str
) -> dict:
    return {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc),
    }


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"],
    }