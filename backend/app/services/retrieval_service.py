
from app.services.vector_store import search_chunks


DEFAULT_RESULTS = 5
CANDIDATE_RESULTS = 8
RELEVANCE_DISTANCE_THRESHOLD = 1.8


def retrieve_relevant_chunks(
    query: str,
    project_id: str,
    n_results: int = DEFAULT_RESULTS,
    source_ids: list[str] | None = None,
) -> list[dict]:
    """
    Retrieve relevant chunks from a project.

    When source_ids is provided, retrieval is restricted to
    those sources. Otherwise, it searches the whole project.
    """

    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if n_results <= 0:
        raise ValueError("n_results must be greater than 0")

    candidate_count = max(CANDIDATE_RESULTS, n_results)

    results = search_chunks(
        query=query,
        project_id=project_id,
        n_results=candidate_count,
        source_ids=source_ids,
    )
    

    documents = results.get("documents", [[]])[0] or []
    metadatas = results.get("metadatas", [[]])[0] or []
    distances = results.get("distances", [[]])[0] or []
    ids = results.get("ids", [[]])[0] or []

    candidates = []

    for index, document in enumerate(documents):
        distance = distances[index] if index < len(distances) else None

        if distance is None:
            continue

        candidates.append({
            "id": ids[index] if index < len(ids) else "",
            "text": document,
            "metadata": (
                metadatas[index]
                if index < len(metadatas)
                else {}
            ),
            "distance": distance,
        })

    relevant_chunks = [
        chunk
        for chunk in candidates
        if chunk["distance"] <= RELEVANCE_DISTANCE_THRESHOLD
    ]

    return relevant_chunks[:n_results]
