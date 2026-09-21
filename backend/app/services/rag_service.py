from app.services.citation_service import resolve_sources
from app.services.context_builder import build_context
from app.services.llm_service import generate_text
from app.services.retrieval_service import retrieve_relevant_chunks


async def answer_question(
    question: str,
    project_id: str,
    conversation_history: list[dict] | None = None,
    n_results: int = 5,
) -> dict:
    """
    Answer a user question using documents stored
    inside a project and relevant conversation history.
    """

    if not question or not question.strip():
        raise ValueError("Question cannot be empty")

    conversation_history = conversation_history or []

    # ========================================================
    # STEP 1: BUILD QUERY USING CONVERSATION CONTEXT
    # ========================================================

    history_text = ""

    if conversation_history:

        history_parts = []

        for message in conversation_history[-6:]:

            role = message.get("role", "")
            content = message.get("content", "")

            if not content:
                continue

            history_parts.append(
                f"{role.upper()}: {content}"
            )

        history_text = "\n".join(history_parts)

    # ========================================================
    # STEP 2: REWRITE QUESTION FOR RETRIEVAL
    # ========================================================

    if history_text:

        rewrite_prompt = f"""
You are a query understanding system for InsightFlow AI.

Rewrite the user's latest question into a clear,
self-contained search query using the conversation
history when necessary.

Do not answer the question.

Return ONLY the rewritten search query.

---------------- CONVERSATION ----------------

{history_text}

---------------- LATEST QUESTION ----------------

{question}

---------------- SEARCH QUERY ----------------
"""

        retrieval_query = generate_text(
            rewrite_prompt
        ).strip()

    else:

        retrieval_query = question.strip()

    # ========================================================
    # STEP 3: RETRIEVE RELEVANT CHUNKS
    # ========================================================

    chunks = retrieve_relevant_chunks(
        query=retrieval_query,
        project_id=project_id,
        n_results=n_results,
    )

    if not chunks:

        return {
            "answer": (
                "I could not find any relevant information "
                "in the provided sources."
            ),
            "sources": [],
        }

    # ========================================================
    # STEP 4: BUILD SOURCE CONTEXT
    # ========================================================

    context = build_context(chunks)

    # ========================================================
    # STEP 5: BUILD CONVERSATION CONTEXT
    # ========================================================

    previous_messages = ""

    if conversation_history:

        conversation_parts = []

        for message in conversation_history[-6:]:

            role = message.get("role", "")
            content = message.get("content", "")

            if not content:
                continue

            conversation_parts.append(
                f"{role.upper()}: {content}"
            )

        previous_messages = "\n".join(
            conversation_parts
        )

    # ========================================================
    # STEP 6: GENERATE ANSWER
    # ========================================================

    prompt = f"""
You are InsightFlow AI, an AI knowledge assistant.

Answer the user's question using ONLY the information
provided in the source context below.

You may use the conversation history to understand
what the user is referring to, but factual information
must come from the provided source context.

Do not use outside knowledge.

If the answer cannot be found in the provided sources,
clearly say that the information is not available in
the provided sources.

Keep the answer clear, accurate, and concise.

---------------- CONVERSATION HISTORY ----------------

{previous_messages}

---------------- SOURCE CONTEXT ----------------

{context}

-------------- END SOURCE CONTEXT ----------------

USER QUESTION:

{question}

ANSWER:
"""

    answer = generate_text(
        prompt
    )

    # ========================================================
    # STEP 7: RESOLVE SOURCE METADATA
    # ========================================================

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

    # ========================================================
    # STEP 8: RETURN ANSWER
    # ========================================================

    return {
        "answer": answer,
        "sources": sources,
    }