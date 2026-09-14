from datetime import datetime

from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


class SourceType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    BLOG = "blog"
    ARTICLE = "article"
    TWEET = "tweet"


class SourceCreate(BaseModel):
    type: SourceType

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    url: HttpUrl | None = None


class SourceResponse(BaseModel):
    id: str
    project_id: str
    type: SourceType
    title: str
    url: str | None
    filename: str | None
    storage_path: str | None
    status: str
    chunk_count: int
    created_at: datetime
    updated_at: datetime