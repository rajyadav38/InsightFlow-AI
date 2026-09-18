from datetime import datetime

from pydantic import BaseModel


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    sources: list[dict]
    created_at: datetime