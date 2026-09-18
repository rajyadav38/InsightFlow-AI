from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import database
from app.models.conversation import (
    create_conversation_document,
    serialize_conversation,
)
from app.models.message import serialize_message
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
)
from app.schemas.message import MessageResponse


router = APIRouter(
    prefix="/api/projects",
    tags=["Conversations"],
)


# ============================================================
# CREATE CONVERSATION
# ============================================================

@router.post(
    "/{project_id}/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    project_id: str,
    conversation: ConversationCreate,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    # Verify project ownership
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

    conversation_document = create_conversation_document(
        project_id=project_id,
        user_id=str(current_user["_id"]),
        title=conversation.title,
    )

    result = await database.conversations.insert_one(
        conversation_document
    )

    created_conversation = (
        await database.conversations.find_one(
            {"_id": result.inserted_id}
        )
    )

    return serialize_conversation(
        created_conversation
    )


# ============================================================
# GET PROJECT CONVERSATIONS
# ============================================================

@router.get(
    "/{project_id}/conversations",
    response_model=list[ConversationResponse],
)
async def get_conversations(
    project_id: str,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    # Verify project ownership
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

    cursor = database.conversations.find(
        {
            "project_id": project_id,
            "user_id": str(current_user["_id"]),
        }
    ).sort("updated_at", -1)

    conversations = await cursor.to_list(
        length=100
    )

    return [
        serialize_conversation(conversation)
        for conversation in conversations
    ]


# ============================================================
# GET CONVERSATION MESSAGES
# ============================================================

@router.get(
    "/{project_id}/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def get_conversation_messages(
    project_id: str,
    conversation_id: str,
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    if not ObjectId.is_valid(conversation_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid conversation ID",
        )

    # Verify project ownership
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

    # Verify conversation belongs to this project and user
    conversation = await database.conversations.find_one(
        {
            "_id": ObjectId(conversation_id),
            "project_id": project_id,
            "user_id": str(current_user["_id"]),
        }
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    cursor = database.messages.find(
        {
            "conversation_id": conversation_id,
        }
    ).sort("created_at", 1)

    messages = await cursor.to_list(
        length=500
    )

    return [
        serialize_message(message)
        for message in messages
    ]