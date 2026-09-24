from app.agents.graph import generation_graph
from app.services.citation_service import resolve_sources


SUPPORTED_TYPES = {
    "linkedin",
    "tweet",
    "blog",
    "newsletter",
}


async def generate_content(
    content_type: str,
    topic: str,
    tone: str,
    instructions: str | None,
    project_id: str,
    n_results: int = 5,
) -> dict:

    if content_type not in SUPPORTED_TYPES:
        raise ValueError(
            f"Unsupported content type: {content_type}"
        )

    if not topic or not topic.strip():
        raise ValueError(
            "Topic cannot be empty"
        )

    # Initial state for LangGraph
    initial_state = {
        "project_id": project_id,
        "content_type": content_type,
        "topic": topic.strip(),
        "tone": tone,
        "instructions": instructions,
        "revision_count": 0,
        "max_revisions": 2,
    }

    # Run the agentic generation workflow
    result = generation_graph.invoke(
        initial_state
    )

    # No relevant source information
    if not result.get("retrieved_chunks"):
        return {
            "content": None,
            "sources": [],
            "fact_check_result": "NO_CONTENT",
            "revision_count": 0,
        }

    content = result.get(
        "generated_content",
        "",
    )

    if not content:
        return {
    "content": None,
    "sources": [],
    "fact_check_result": "NO_CONTENT",
    "revision_count": 0,
}

    # Resolve ChromaDB source IDs
    # into MongoDB source metadata
    chunks = result.get(
        "retrieved_chunks",
        [],
    )

    source_ids = [
        chunk["metadata"]["source_id"]
        for chunk in chunks
    ]

    source_metadata = await resolve_sources(
        source_ids=source_ids,
        project_id=project_id,
    )

    sources = []

    for index, chunk in enumerate(
        chunks,
        start=1,
    ):
        source_id = chunk["metadata"]["source_id"]

        metadata = source_metadata.get(
            source_id
        )

        if not metadata:
            continue

        sources.append(
            {
                **metadata,
                "citation_index": index,
                "chunk_index": chunk["metadata"]["chunk_index"],
                "distance": chunk["distance"],
                "excerpt": chunk["text"],
            }
        )

    return {
    "content": content,
    "sources": sources,
    "fact_check_result": result.get(
        "fact_check_result",
        "PASS",
    ),
    "revision_count": result.get(
        "revision_count",
        0,
    ),
}