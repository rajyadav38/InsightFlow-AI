
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import database
from app.models.generated_content import (
    create_generated_content_document,
    serialize_generated_content,
)
from app.schemas.generation import GenerateRequest, GenerateResponse
from app.services.generation_service import generate_content


router = APIRouter(
    prefix="/api/projects",
    tags=["Generation"],
)


@router.post(
    "/{project_id}/generate",
    response_model=GenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_project_content(
    project_id: str,
    request: GenerateRequest,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid project ID",
        )

    user_id = str(current_user["_id"])

    project = await database.projects.find_one({
        "_id": ObjectId(project_id),
        "user_id": user_id,
    })

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    selected_source_ids = list(dict.fromkeys(request.source_ids or []))

    if selected_source_ids:
        if any(
            not ObjectId.is_valid(source_id)
            for source_id in selected_source_ids
        ):
            raise HTTPException(
                status_code=400,
                detail="One or more selected source IDs are invalid.",
            )

        source_object_ids = [
            ObjectId(source_id)
            for source_id in selected_source_ids
        ]

        matching_sources = await database.sources.find(
            {
                "_id": {"$in": source_object_ids},
                "project_id": project_id,
                "user_id": user_id,
            },
            {"_id": 1},
        ).to_list(length=len(source_object_ids))

        valid_source_ids = {
            str(source["_id"])
            for source in matching_sources
        }

        if valid_source_ids != set(selected_source_ids):
            raise HTTPException(
                status_code=400,
                detail=(
                    "One or more selected sources do not belong "
                    "to this project."
                ),
            )

    try:
        result = await generate_content(
            content_type=request.type,
            topic=request.topic,
            tone=request.tone,
            instructions=request.instructions,
            project_id=project_id,
            n_results=5,
            source_ids=selected_source_ids or None,
        )

        if not result.get("content"):
            raise HTTPException(
                status_code=422,
                detail=(
                    "No relevant information was found in the "
                    "selected sources or project to generate this content."
                ),
            )

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    except HTTPException:
        raise

    except Exception as error:
        print(f"Content generation error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate content",
        )

    document = create_generated_content_document(
        project_id=project_id,
        user_id=user_id,
        content_type=request.type,
        topic=request.topic,
        tone=request.tone,
        instructions=request.instructions,
        content=result["content"],
        sources=result["sources"],
        fact_check_result=result["fact_check_result"],
        revision_count=result["revision_count"],
    )

    inserted = await database.generated_content.insert_one(document)
    document["_id"] = inserted.inserted_id

    return serialize_generated_content(document)
