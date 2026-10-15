
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.dependencies import get_current_user
from app.db.database import database
from app.schemas.profile import ProfileUpdate

router = APIRouter(prefix="/api/auth", tags=["User Profile"])


def serialize_profile(user):
    created_at = user.get("created_at")
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "bio": user.get("bio", ""),
        "job_title": user.get("job_title", ""),
        "organization": user.get("organization", ""),
        "location": user.get("location", ""),
        "website": user.get("website", ""),
        "interests": user.get("interests", []),
        "created_at": created_at.isoformat() if created_at else None,
    }


@router.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    return serialize_profile(current_user)


@router.patch("/profile")
async def update_profile(
    payload: ProfileUpdate,
    current_user=Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)

    if "name" in updates and not updates["name"]:
        raise HTTPException(
            status_code=422,
            detail="Name cannot be empty",
        )

    if "website" in updates and updates["website"]:
        website = updates["website"]
        if not website.startswith(("https://", "http://")):
            updates["website"] = f"https://{website}"

    updates["updated_at"] = datetime.now(timezone.utc)

    await database.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": updates},
    )

    updated_user = await database.users.find_one(
        {"_id": current_user["_id"]}
    )

    return serialize_profile(updated_user)
