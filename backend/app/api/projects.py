from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import database
from app.models.project import (
    create_project_document,
    serialize_project,
)
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)


router = APIRouter(
    prefix="/api/projects",
    tags=["Projects"],
)


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_project(
    project: ProjectCreate,
    current_user=Depends(get_current_user),
):
    project_document = create_project_document(
        user_id=str(current_user["_id"]),
        name=project.name,
        description=project.description,
    )

    result = await database.projects.insert_one(
        project_document
    )

    created_project = await database.projects.find_one(
        {"_id": result.inserted_id}
    )

    return serialize_project(created_project)


@router.get(
    "",
    response_model=list[ProjectResponse],
)
async def get_projects(
    current_user=Depends(get_current_user),
):
    cursor = database.projects.find(
        {
            "user_id": str(current_user["_id"])
        }
    ).sort("created_at", -1)

    projects = await cursor.to_list(length=100)

    return [
        serialize_project(project)
        for project in projects
    ]


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
async def get_project(
    project_id: str,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    project = await database.projects.find_one(
        {
            "_id": ObjectId(project_id),
            "user_id": str(current_user["_id"]),
        }
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return serialize_project(project)


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
async def update_project(
    project_id: str,
    project: ProjectUpdate,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    update_data = project.model_dump(
        exclude_unset=True
    )

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update",
        )

    update_data["updated_at"] = datetime.now(
        timezone.utc
    )

    result = await database.projects.update_one(
        {
            "_id": ObjectId(project_id),
            "user_id": str(current_user["_id"]),
        },
        {
            "$set": update_data
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    updated_project = await database.projects.find_one(
        {
            "_id": ObjectId(project_id),
            "user_id": str(current_user["_id"]),
        }
    )

    return serialize_project(updated_project)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_project(
    project_id: str,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    result = await database.projects.delete_one(
        {
            "_id": ObjectId(project_id),
            "user_id": str(current_user["_id"]),
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )