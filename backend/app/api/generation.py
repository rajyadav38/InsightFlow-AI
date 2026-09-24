from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import database
from app.models.generated_content import (
    create_generated_content_document,
    serialize_generated_content,
)
from app.schemas.generation import (
    GenerateRequest,
    GenerateResponse,
)
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
    """
    Generate content using the sources
    available inside a project.
    """

    # -----------------------------------------
    # Validate project ID
    # -----------------------------------------

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

# -----------------------------------------
# Verify project ownership
# -----------------------------------------

    user_id = str(current_user["_id"])

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
# Generate content
# -----------------------------------------

    try:
        result = await generate_content(
            content_type=request.type,
            topic=request.topic,
            tone=request.tone,
            instructions=request.instructions,
            project_id=project_id,
            n_results=5,
        )
        
        if not result["content"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "No relevant information was found "
                    "in the provided sources to generate "
                    "this content."
                ),
            )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )
    
    except HTTPException:
        raise

    except Exception as error:
        print(
            f"❌ Content generation error: {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate content",
        )

# -----------------------------------------
# Save generated content
# -----------------------------------------

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

    inserted = await database.generated_content.insert_one(
        document
    )

    document["_id"] = inserted.inserted_id

# -----------------------------------------
# Return response
# -----------------------------------------

    return serialize_generated_content(
        document
    )