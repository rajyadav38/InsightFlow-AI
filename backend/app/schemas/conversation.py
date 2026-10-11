from datetime import datetime

from pydantic import BaseModel, Field

class ConversationRename(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)

class ConversationCreate(BaseModel):
    title: str = Field(
        default="New Chat",
        min_length=1,
        max_length=100,
    )


class ConversationResponse(BaseModel):
    id: str
    project_id: str
    title: str
    created_at: datetime
    updated_at: datetime