from pydantic import BaseModel, Field


# ============================================================
# CHAT REQUEST
# ============================================================

class ChatRequest(BaseModel):

    conversation_id: str

    question: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


# ============================================================
# CHAT SOURCE / CITATION
# ============================================================

class ChatSource(BaseModel):

    source_id: str

    title: str

    type: str

    filename: str | None = None

    url: str | None = None

    citation_index: int

    chunk_index: int

    distance: float

    excerpt: str


# ============================================================
# CHAT RESPONSE
# ============================================================

class ChatResponse(BaseModel):

    answer: str

    sources: list[ChatSource]