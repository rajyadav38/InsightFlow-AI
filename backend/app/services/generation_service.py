from app.services.citation_service import resolve_sources
from app.services.context_builder import build_context
from app.services.llm_service import generate_text
from app.services.retrieval_service import retrieve_relevant_chunks


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

    retrieval_query = topic.strip()

    chunks = retrieve_relevant_chunks(
        query=retrieval_query,
        project_id=project_id,
        n_results=n_results,
    )

    if not chunks:
        return {
            "content": None,
            "sources": [],
        }

    context = build_context(chunks)

    instructions_text = (
        instructions.strip()
        if instructions
        else "No additional instructions."
    )

    prompt = f"""
You are InsightFlow AI, an AI content generation
assistant.

Generate {content_type} content using ONLY the
information provided in the source context.

Do not use outside knowledge.

The generated content must remain factually
grounded in the provided sources.

---------------- CONTENT TYPE ----------------

{content_type}

---------------- TOPIC ----------------

{topic}

---------------- TONE ----------------

{tone}

---------------- ADDITIONAL INSTRUCTIONS ----------------

{instructions_text}

---------------- SOURCE CONTEXT ----------------

{context}

---------------- END SOURCE CONTEXT ----------------

Generate the requested content now.

Return ONLY the generated content.
"""

    content = generate_text(
        prompt
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
}