from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    conversation_id: str
    question: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class ChatSource(BaseModel):
    source_id: str
    title: str
    type: str
    filename: str | None = None
    url: str | None = None
    chunk_index: int
    distance: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]