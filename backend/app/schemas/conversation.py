from datetime import datetime

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    title: str = Field(
        default="New Chat",
        min_length=1,
        max_length=200,
    )


class ConversationResponse(BaseModel):
    id: str
    project_id: str
    title: str
    created_at: datetime
    updated_at: datetime