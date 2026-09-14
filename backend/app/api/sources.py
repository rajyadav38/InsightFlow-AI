from uuid import uuid4

from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from app.api.dependencies import get_current_user
from app.db.database import database
from app.models.source import (
    create_source_document,
    serialize_source,
)
from app.schemas.source import (
    SourceResponse,
)
from app.services.file_storage import (
    delete_file,
    upload_file,
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
    type: str = Form(...),
    title: str = Form(...),
    url: str | None = Form(None),
    file: UploadFile | None = File(None),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    await get_user_project(
        project_id,
        user_id,
    )

    # Validate source type
    allowed_types = {
        "pdf",
        "docx",
        "txt",
        "blog",
        "article",
        "tweet",
    }

    if type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid source type",
        )

    file_types = {
        "pdf",
        "docx",
        "txt",
    }

    web_types = {
        "blog",
        "article",
        "tweet",
    }

    # File-based sources require a file
    if type in file_types and file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is required for this source type",
        )

    # Web-based sources require a URL
    if type in web_types and not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required for this source type",
        )

    # Web sources should not receive a file
    if type in web_types and file is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not allowed for this source type",
        )

    # File sources should not receive a URL
    if type in file_types and url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is not allowed for this source type",
        )

    source_id = ObjectId()

    filename = None
    storage_path = None

    # Upload physical file to Supabase
    if file is not None:
        filename = file.filename

        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is missing",
            )

        extension = filename.lower().split(".")[-1]

        if extension != type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File extension must be .{type}",
            )

        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty",
            )

        storage_path = (
            f"users/{user_id}/"
            f"projects/{project_id}/"
            f"sources/{source_id}.{extension}"
        )

        try:
            upload_file(
                file_bytes=file_bytes,
                storage_path=storage_path,
                content_type=(
                    file.content_type
                    or "application/octet-stream"
                ),
            )

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(exc)}",
            )

    # Create MongoDB source document
    source_document = create_source_document(
        project_id=project_id,
        user_id=user_id,
        source_type=type,
        title=title,
        url=url,
        filename=filename,
        storage_path=storage_path,
    )

    # Use the same ID we generated for the storage path
    source_document["_id"] = source_id

    try:
        await database.sources.insert_one(
            source_document
        )

    except Exception as exc:
        # Roll back Supabase upload if MongoDB insert fails
        if storage_path:
            try:
                delete_file(storage_path)
            except Exception:
                pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(exc)}",
        )

    return serialize_source(source_document)


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
    ).sort(
        "created_at",
        -1,
    )

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

    source = await database.sources.find_one(
        {
            "_id": ObjectId(source_id),
            "project_id": project_id,
            "user_id": user_id,
        }
    )

    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found",
        )

    storage_path = source.get("storage_path")

    # Delete actual file from Supabase first
    if storage_path:
        try:
            delete_file(storage_path)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete stored file: {str(exc)}",
            )

    # Delete metadata from MongoDB
    await database.sources.delete_one(
        {
            "_id": ObjectId(source_id),
            "project_id": project_id,
            "user_id": user_id,
        }
    )