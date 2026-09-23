from typing import TypedDict


class GenerationState(TypedDict, total=False):
    project_id: str

    content_type: str
    topic: str
    tone: str
    instructions: str | None

    retrieved_chunks: list[dict]
    context: str

    generated_content: str

    fact_check_result: str
    fact_check_feedback: str

    revision_count: int
    max_revisions: int

    sources: list[dict]