from datetime import datetime

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    type: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    topic: str = Field(
        ...,
        min_length=1,
        max_length=500,
    )

    tone: str = Field(
        default="professional",
        min_length=1,
        max_length=100,
    )

    instructions: str | None = Field(
        default=None,
        max_length=2000,
    )


class GeneratedSource(BaseModel):
    source_id: str
    title: str
    type: str
    filename: str | None = None
    url: str | None = None
    citation_index: int
    chunk_index: int
    distance: float
    excerpt: str


class GenerateResponse(BaseModel):
    id: str
    project_id: str
    type: str
    topic: str
    tone: str
    instructions: str | None
    content: str
    sources: list[GeneratedSource]

    fact_check_result: str
    revision_count: int

    created_at: datetime
    updated_at: datetime