from datetime import datetime, timezone

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
from app.schemas.source import SourceResponse

from app.services.document_processor import (
    process_document,
    sync_processed_document_to_vector_store,
)

from app.services.file_storage import (
    delete_file,
    upload_file,
)

from app.services.vector_store import has_source_chunks


router = APIRouter(
    prefix="/api/projects/{project_id}/sources",
    tags=["Sources"],
)


# ============================================================
# GET USER PROJECT
# ============================================================

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


# ============================================================
# CREATE SOURCE
# ============================================================

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

    # Verify project ownership
    await get_user_project(
        project_id,
        user_id,
    )

    # Allowed source types
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

    # File sources require a file
    if type in file_types and file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is required for this source type",
        )

    # Web sources require a URL
    if type in web_types and not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is required for this source type",
        )

    # Web sources cannot contain files
    if type in web_types and file is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not allowed for this source type",
        )

    # File sources cannot contain URLs
    if type in file_types and url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is not allowed for this source type",
        )

    # Generate source ID before uploading
    source_id = ObjectId()

    filename = None
    storage_path = None

    # ========================================================
    # UPLOAD FILE TO SUPABASE
    # ========================================================

    if file is not None:

        filename = file.filename

        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is missing",
            )

        # Get file extension
        if "." not in filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must have an extension",
            )

        extension = filename.rsplit(
            ".",
            1,
        )[1].lower()

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

        # Supabase Storage path
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

    # ========================================================
    # CREATE MONGODB SOURCE
    # ========================================================

    source_document = create_source_document(
        project_id=project_id,
        user_id=user_id,
        source_type=type,
        title=title,
        url=url,
        filename=filename,
        storage_path=storage_path,
    )

    # Use the same ID as the Supabase filename
    source_document["_id"] = source_id

    try:

        await database.sources.insert_one(
            source_document
        )

    except Exception as exc:

        # Roll back Supabase upload
        if storage_path:
            try:
                delete_file(storage_path)
            except Exception:
                pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(exc)}",
        )

    return serialize_source(
        source_document
    )


# ============================================================
# GET SOURCES
# ============================================================

@router.get(
    "",
    response_model=list[SourceResponse],
)
async def get_sources(
    project_id: str,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    # Verify project ownership
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


# ============================================================
# PROCESS DOCUMENT
# ============================================================

@router.post(
    "/{source_id}/process",
    response_model=SourceResponse,
)
async def process_source(
    project_id: str,
    source_id: str,
    current_user=Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    # Verify project ownership
    await get_user_project(
        project_id,
        user_id,
    )

    # Validate source ID
    if not ObjectId.is_valid(source_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid source ID",
        )

    # Find source
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

    # Only file sources can be processed
    if source["type"] not in {
        "pdf",
        "docx",
        "txt",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only PDF, DOCX, and TXT "
                "sources can be processed"
            ),
        )

    storage_path = source.get(
        "storage_path"
    )

    if not storage_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source does not have a stored file",
        )

    # ========================================================
    # CHECK EXISTING PROCESSING
    # ========================================================

    if source.get("status") == "processed":

        # Check if chunks already exist in ChromaDB
        chunks_exist = has_source_chunks(
            source_id=source_id
        )

        # Everything is already synchronized
        if chunks_exist:
            return serialize_source(source)

        # ====================================================
        # SOURCE WAS PROCESSED BUT CHROMADB IS MISSING CHUNKS
        # ====================================================

        processed_storage_path = source.get(
            "processed_storage_path"
        )

        if not processed_storage_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Source is marked as processed but "
                    "processed text is missing"
                ),
            )

        try:

            result = sync_processed_document_to_vector_store(
                processed_storage_path=processed_storage_path,
                source_id=source_id,
                project_id=project_id,
            )

            await database.sources.update_one(
                {
                    "_id": ObjectId(source_id),
                    "project_id": project_id,
                    "user_id": user_id,
                },
                {
                    "$set": {
                        "chunk_count": result[
                            "chunk_count"
                        ],
                        "status": "processed",
                        "updated_at": datetime.now(
                            timezone.utc
                        ),
                    }
                },
            )

        except Exception as exc:

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Failed to synchronize document "
                    f"with ChromaDB: {str(exc)}"
                ),
            )

        updated_source = await database.sources.find_one(
            {
                "_id": ObjectId(source_id),
                "project_id": project_id,
                "user_id": user_id,
            }
        )

        return serialize_source(
            updated_source
        )

    # ========================================================
    # MARK SOURCE AS PROCESSING
    # ========================================================

    await database.sources.update_one(
        {
            "_id": ObjectId(source_id),
            "project_id": project_id,
            "user_id": user_id,
        },
        {
            "$set": {
                "status": "processing",
                "updated_at": datetime.now(
                    timezone.utc
                ),
            }
        },
    )

    # Where extracted text will be stored
    processed_storage_path = (
        f"users/{user_id}/"
        f"projects/{project_id}/"
        f"processed/{source_id}.txt"
    )

    try:

        # ====================================================
        # PROCESS DOCUMENT
        # ====================================================

        result = process_document(
            storage_path=storage_path,
            source_type=source["type"],
            processed_storage_path=processed_storage_path,
            source_id=source_id,
            project_id=project_id,
        )

        # ====================================================
        # UPDATE MONGODB
        # ====================================================

        await database.sources.update_one(
            {
                "_id": ObjectId(source_id),
                "project_id": project_id,
                "user_id": user_id,
            },
            {
                "$set": {
                    "processed_storage_path": (
                        result[
                            "processed_storage_path"
                        ]
                    ),
                    "character_count": (
                        result[
                            "character_count"
                        ]
                    ),
                    "chunk_count": (
                        result[
                            "chunk_count"
                        ]
                    ),
                    "status": "processed",
                    "updated_at": datetime.now(
                        timezone.utc
                    ),
                }
            },
        )

    except Exception as exc:

        # Mark processing as failed
        await database.sources.update_one(
            {
                "_id": ObjectId(source_id),
                "project_id": project_id,
                "user_id": user_id,
            },
            {
                "$set": {
                    "status": "failed",
                    "updated_at": datetime.now(
                        timezone.utc
                    ),
                }
            },
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                f"Document processing failed: {str(exc)}"
            ),
        )

    # ========================================================
    # GET UPDATED SOURCE
    # ========================================================

    updated_source = await database.sources.find_one(
        {
            "_id": ObjectId(source_id),
            "project_id": project_id,
            "user_id": user_id,
        }
    )

    return serialize_source(
        updated_source
    )


# ============================================================
# DELETE SOURCE
# ============================================================

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

    # Verify project ownership
    await get_user_project(
        project_id,
        user_id,
    )

    # Validate source ID
    if not ObjectId.is_valid(source_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid source ID",
        )

    # Find source
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

    # ========================================================
    # DELETE ORIGINAL FILE
    # ========================================================

    storage_path = source.get(
        "storage_path"
    )

    if storage_path:

        try:
            delete_file(
                storage_path
            )

        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    f"Failed to delete stored file: {str(exc)}"
                ),
            )

    # ========================================================
    # DELETE PROCESSED TEXT
    # ========================================================

    processed_storage_path = source.get(
        "processed_storage_path"
    )

    if processed_storage_path:

        try:
            delete_file(
                processed_storage_path
            )

        except Exception:
            # Don't block MongoDB cleanup if
            # processed text is already missing.
            pass

    # ========================================================
    # DELETE MONGODB METADATA
    # ========================================================

    await database.sources.delete_one(
        {
            "_id": ObjectId(source_id),
            "project_id": project_id,
            "user_id": user_id,
        }
    )