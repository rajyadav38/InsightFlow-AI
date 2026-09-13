from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import database
from app.models.source import (
    create_source_document,
    serialize_source,
)
from app.schemas.source import (
    SourceCreate,
    SourceResponse,
)


router = APIRouter(
    prefix="/api/projects/{project_id}/sources",
    tags=["Sources"],
)


async def get_user_project(
    project_id: str,
    user_id: str,
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

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

    return project


@router.post(
    "",
    response_model=SourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_source(
    project_id: str,
    source: SourceCreate,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    await get_user_project(
        project_id,
        user_id,
    )

    # URL is required for web-based sources
    if source.type in {
        "blog",
        "article",
        "tweet",
    } and not source.url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required for this source type",
        )

    source_document = create_source_document(
        project_id=project_id,
        user_id=user_id,
        source_type=source.type.value,
        title=source.title,
        url=str(source.url) if source.url else None,
    )

    result = await database.sources.insert_one(
        source_document
    )

    created_source = await database.sources.find_one(
        {
            "_id": result.inserted_id
        }
    )

    return serialize_source(created_source)


@router.get(
    "",
    response_model=list[SourceResponse],
)
async def get_sources(
    project_id: str,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    await get_user_project(
        project_id,
        user_id,
    )

    cursor = database.sources.find(
        {
            "project_id": project_id,
            "user_id": user_id,
        }
    ).sort("created_at", -1)

    sources = await cursor.to_list(
        length=100
    )

    return [
        serialize_source(source)
        for source in sources
    ]

@router.delete(
    "/{source_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_source(
    project_id: str,
    source_id: str,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    await get_user_project(
        project_id,
        user_id,
    )

    if not ObjectId.is_valid(source_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid source ID",
        )

    result = await database.sources.delete_one(
        {
            "_id": ObjectId(source_id),
            "project_id": project_id,
            "user_id": user_id,
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )