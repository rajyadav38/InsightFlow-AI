from app.services.citation_service import resolve_sources
from app.services.context_builder import build_context
from app.services.llm_service import generate_text
from app.services.retrieval_service import retrieve_relevant_chunks


async def answer_question(
    question: str,
    project_id: str,
    n_results: int = 5,
) -> dict:
    """
    Answer a user question using documents
    stored inside a project.
    """

    if not question or not question.strip():
        raise ValueError("Question cannot be empty")

    # ========================================================
    # STEP 1: RETRIEVE RELEVANT CHUNKS
    # ========================================================

    chunks = retrieve_relevant_chunks(
        query=question,
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
    # STEP 2: BUILD CONTEXT
    # ========================================================

    context = build_context(chunks)

    # ========================================================
    # STEP 3: BUILD RAG PROMPT
    # ========================================================

    prompt = f"""
You are InsightFlow AI, an AI knowledge assistant.

Answer the user's question using ONLY the information
provided in the context below.

Do not use outside knowledge.

If the answer cannot be found in the provided context,
clearly say that the information is not available in
the provided sources.

Keep the answer clear, accurate, and concise.

---------------- CONTEXT ----------------

{context}

-------------- END CONTEXT --------------

USER QUESTION:

{question}

ANSWER:
"""

    # ========================================================
    # STEP 4: GENERATE ANSWER
    # ========================================================

    answer = generate_text(prompt)

    # ========================================================
    # STEP 5: RESOLVE SOURCE METADATA
    # ========================================================

    source_ids = [
        chunk["metadata"]["source_id"]
        for chunk in chunks
    ]

    source_metadata = await resolve_sources(
        source_ids=source_ids,
        project_id=project_id,
    )

    # ========================================================
    # STEP 6: BUILD CITATIONS
    # ========================================================

    sources = []

    for chunk in chunks:
        source_id = chunk["metadata"]["source_id"]

        metadata = source_metadata.get(source_id)

        if not metadata:
            continue

        sources.append(
            {
                **metadata,
                "chunk_index": chunk["metadata"]["chunk_index"],
                "distance": chunk["distance"],
            }
        )

    return {
        "answer": answer,
        "sources": sources,
    }