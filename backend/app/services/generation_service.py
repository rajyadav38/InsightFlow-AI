
from app.agents.graph import generation_graph
from app.services.citation_service import resolve_sources


SUPPORTED_TYPES = {
    "linkedin_post",
    "linkedin",  # Legacy alias
    "tweet",
    "blog",
    "newsletter",
    "summary",
}


async def generate_content(
    content_type: str,
    topic: str,
    tone: str,
    instructions: str | None,
    project_id: str,
    n_results: int = 5,
    source_ids: list[str] | None = None,
) -> dict:
    if content_type not in SUPPORTED_TYPES:
        raise ValueError(
            f"Unsupported content type: {content_type}"
        )

    if not topic or not topic.strip():
        raise ValueError("Topic cannot be empty")

    # Deduplicate IDs while preserving their order.
    selected_source_ids = list(dict.fromkeys(source_ids or []))

    initial_state = {
        "project_id": project_id,
        "content_type": content_type,
        "topic": topic.strip(),
        "tone": tone,
        "instructions": instructions,
        "source_ids": selected_source_ids or None,
        "revision_count": 0,
        "max_revisions": 2,
    }

    result = generation_graph.invoke(initial_state)

    chunks = result.get("retrieved_chunks", [])

    if not chunks:
        return {
            "content": None,
            "sources": [],
            "fact_check_result": "NO_CONTENT",
            "revision_count": 0,
        }

    content = result.get("generated_content", "")

    if not content:
        return {
            "content": None,
            "sources": [],
            "fact_check_result": "NO_CONTENT",
            "revision_count": 0,
        }

    # Resolve source IDs into MongoDB source metadata.
    retrieved_source_ids = list(dict.fromkeys(
        chunk["metadata"]["source_id"]
        for chunk in chunks
        if chunk.get("metadata", {}).get("source_id")
    ))

    source_metadata = await resolve_sources(
        source_ids=retrieved_source_ids,
        project_id=project_id,
    )

    sources = []

    for index, chunk in enumerate(chunks, start=1):
        metadata = chunk.get("metadata", {})
        source_id = metadata.get("source_id")

        source_info = source_metadata.get(source_id)

        if not source_info:
            continue

        sources.append({
            **source_info,
            "citation_index": index,
            "chunk_index": metadata.get("chunk_index"),
            "distance": chunk.get("distance"),
            "excerpt": chunk.get("text", ""),
        })

    return {
        "content": content,
        "sources": sources,
        "fact_check_result": result.get(
            "fact_check_result",
            "PASS",
        ),
        "revision_count": result.get("revision_count", 0),
    }
