
from pydantic import BaseModel, Field, HttpUrl, ConfigDict, field_validator


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=2, max_length=80)
    bio: str | None = Field(default=None, max_length=300)
    job_title: str | None = Field(default=None, max_length=100)
    organization: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=100)
    website: str | None = Field(default=None, max_length=200)
    interests: list[str] | None = Field(default=None, max_length=12)

    @field_validator(
        "name", "bio", "job_title", "organization", "location", "website",
        mode="before",
    )
    @classmethod
    def clean_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("interests")
    @classmethod
    def clean_interests(cls, values):
        if values is None:
            return values

        cleaned = []
        for item in values:
            item = item.strip()
            if item and item not in cleaned:
                cleaned.append(item)

        if any(len(item) > 40 for item in cleaned):
            raise ValueError("Each interest must be 40 characters or fewer")

        return cleaned
