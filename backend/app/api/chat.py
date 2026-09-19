from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.db.database import database
from app.models.message import create_message_document
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import answer_question


router = APIRouter(
    prefix="/api/projects",
    tags=["Chat"],
)


# ============================================================
# CHAT WITH PROJECT
# ============================================================

@router.post(
    "/{project_id}/chat",
    response_model=ChatResponse,
)
async def chat_with_project(
    project_id: str,
    request: ChatRequest,
    current_user=Depends(get_current_user),
):
    """
    Ask a question about the sources inside a project
    and save the conversation messages.
    """

    # ========================================================
    # VALIDATE PROJECT ID
    # ========================================================

    if not ObjectId.is_valid(project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID",
        )

    # ========================================================
    # VERIFY PROJECT OWNERSHIP
    # ========================================================

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

    # ========================================================
    # VALIDATE CONVERSATION ID
    # ========================================================

    if not ObjectId.is_valid(
        request.conversation_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid conversation ID",
        )

    # ========================================================
    # VERIFY CONVERSATION OWNERSHIP
    # ========================================================

    conversation = await database.conversations.find_one(
        {
            "_id": ObjectId(request.conversation_id),
            "project_id": project_id,
            "user_id": str(current_user["_id"]),
        }
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # ========================================================
    # GET RECENT CONVERSATION HISTORY
    # ========================================================
    #
    # IMPORTANT:
    # We fetch this BEFORE saving the current user message.
    #
    # This prevents the current question from appearing twice
    # in the conversation context.
    # ========================================================

    history_cursor = database.messages.find(
        {
            "conversation_id": request.conversation_id,
        }
    ).sort(
        "created_at",
        -1,
    )

    history_messages = await history_cursor.to_list(
        length=6
    )

    # Reverse so messages are in chronological order
    history_messages.reverse()

    conversation_history = [
        {
            "role": message["role"],
            "content": message["content"],
        }
        for message in history_messages
    ]

    # ========================================================
    # SAVE USER MESSAGE
    # ========================================================

    user_message = create_message_document(
        conversation_id=request.conversation_id,
        role="user",
        content=request.question,
    )

    await database.messages.insert_one(
        user_message
    )

    # ========================================================
    # RUN RAG PIPELINE
    # ========================================================

    try:

        result = await answer_question(
            question=request.question,
            project_id=project_id,
            conversation_history=conversation_history,
            n_results=5,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:

        print(
            f"❌ RAG error: {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate answer",
        )

    # ========================================================
    # SAVE ASSISTANT MESSAGE
    # ========================================================

    assistant_message = create_message_document(
        conversation_id=request.conversation_id,
        role="assistant",
        content=result["answer"],
        sources=result["sources"],
    )

    await database.messages.insert_one(
        assistant_message
    )

    # ========================================================
    # UPDATE CONVERSATION
    # ========================================================

    await database.conversations.update_one(
        {
            "_id": ObjectId(request.conversation_id),
            "project_id": project_id,
            "user_id": str(current_user["_id"]),
        },
        {
            "$set": {
                "updated_at": datetime.now(
                    timezone.utc
                )
            }
        },
    )

    # ========================================================
    # RETURN RESPONSE
    # ========================================================

    return result