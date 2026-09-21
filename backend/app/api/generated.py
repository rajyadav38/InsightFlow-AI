from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import database
from app.models.generated_content import (
    serialize_generated_content,
)


router = APIRouter(
    prefix="/api/projects",
    tags=["Generated Content"],
)


@router.get(
    "/{project_id}/generated",
)
async def get_generated_content(
    project_id: str,
    current_user=Depends(get_current_user),
):
    """
    Get all generated content for a project.
    """

    # -----------------------------------------
    # Validate project ID
    # -----------------------------------------

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    user_id = str(current_user["_id"])

# -----------------------------------------
# Verify project ownership
# -----------------------------------------

    project = await database.projects.find_one(
        {
            "_id": ObjectId(project_id),
            "user_id": user_id,
        }
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

# -----------------------------------------
# Fetch generated content
# -----------------------------------------

    cursor = database.generated_content.find(
        {
            "project_id": project_id,
            "user_id": user_id,
        }
    ).sort(
        "created_at",
        -1,
    )

    documents = await cursor.to_list(
        length=100
    )

    return [
    serialize_generated_content(document)
    for document in documents
    ]


@router.get(
    "/{project_id}/generated/{content_id}",
)
async def get_generated_content_by_id(
    project_id: str,
    content_id: str,
    current_user=Depends(get_current_user),
):
    """
    Get one generated content item.
    """

    # -----------------------------------------
    # Validate IDs
    # -----------------------------------------

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    if not ObjectId.is_valid(content_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content ID",
        )

    user_id = str(current_user["_id"])

# -----------------------------------------
# Verify project ownership
# -----------------------------------------

    project = await database.projects.find_one(
        {
            "_id": ObjectId(project_id),
            "user_id": user_id,
        }
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

# -----------------------------------------
# Find generated content
# -----------------------------------------

    document = await database.generated_content.find_one(
        {
            "_id": ObjectId(content_id),
            "project_id": project_id,
            "user_id": user_id,
        }
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated content not found",
        )

    return serialize_generated_content(
    document
    )


@router.delete(
    "/{project_id}/generated/{content_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_generated_content(
    project_id: str,
    content_id: str,
    current_user=Depends(get_current_user),
):
    """
    Delete generated content.
    """

    # -----------------------------------------
    # Validate IDs
    # -----------------------------------------

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    if not ObjectId.is_valid(content_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content ID",
        )

    user_id = str(current_user["_id"])

# -----------------------------------------
# Verify project ownership
# -----------------------------------------

    project = await database.projects.find_one(
        {
            "_id": ObjectId(project_id),
            "user_id": user_id,
        }
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

# -----------------------------------------
# Delete generated content
# -----------------------------------------

    result = await database.generated_content.delete_one(
        {
            "_id": ObjectId(content_id),
            "project_id": project_id,
            "user_id": user_id,
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated content not found",
        )