from typing import TypedDict


class GenerationState(TypedDict, total=False):
    project_id: str

    # User request
    content_type: str
    topic: str
    tone: str
    instructions: str | None

    # Supervisor decision
    workflow: str

    # Retrieval
    retrieved_chunks: list[dict]
    context: str

    # Research
    research_brief: str
    research_findings: list[str]

    # Generated content
    generated_content: str

    # Fact checking
    fact_check_result: str
    fact_check_feedback: str

    # Revision
    revision_count: int
    max_revisions: int

    # Citations
    sources: list[dict]