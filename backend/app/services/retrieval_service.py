from app.services.vector_store import search_chunks


# ============================================================
# RETRIEVAL CONFIGURATION
# ============================================================

DEFAULT_RESULTS = 5
CANDIDATE_RESULTS = 8

# ChromaDB distance is lower = more relevant.
#
# This is intentionally not extremely strict because different
# documents can produce different distance distributions.
RELEVANCE_DISTANCE_THRESHOLD = 1.0


# ============================================================
# RETRIEVE RELEVANT CHUNKS
# ============================================================

def retrieve_relevant_chunks(
    query: str,
    project_id: str,
    n_results: int = DEFAULT_RESULTS,
) -> list[dict]:
    """
    Retrieve relevant document chunks for a user's query.

    The system first retrieves a larger set of candidate chunks
    from ChromaDB and then filters them using the similarity
    distance returned by ChromaDB.

    Lower distance = better semantic similarity.
    """

    # ========================================================
    # VALIDATE QUERY
    # ========================================================

    if not query or not query.strip():
        raise ValueError(
            "Query cannot be empty"
        )

    if n_results <= 0:
        raise ValueError(
            "n_results must be greater than 0"
        )

    # ========================================================
    # RETRIEVE CANDIDATE CHUNKS
    # ========================================================

    candidate_count = max(
        CANDIDATE_RESULTS,
        n_results,
    )

    results = search_chunks(
        query=query,
        project_id=project_id,
        n_results=candidate_count,
    )

    # ========================================================
    # EXTRACT CHROMADB RESULTS
    # ========================================================

    documents = results.get(
        "documents",
        [[]],
    )[0]

    metadatas = results.get(
        "metadatas",
        [[]],
    )[0]

    distances = results.get(
        "distances",
        [[]],
    )[0]

    ids = results.get(
        "ids",
        [[]],
    )[0]

    # ========================================================
    # BUILD CANDIDATE LIST
    # ========================================================

    candidates = []

    for index in range(len(documents)):

        distance = distances[index]

        candidates.append(
            {
                "id": ids[index],
                "text": documents[index],
                "metadata": metadatas[index],
                "distance": distance,
            }
        )

    # ========================================================
    # FILTER BY RELEVANCE
    # ========================================================

    relevant_chunks = [
        chunk
        for chunk in candidates
        if chunk["distance"]
        <= RELEVANCE_DISTANCE_THRESHOLD
    ]


    # ========================================================
    # LIMIT FINAL RESULTS
    # ========================================================

    relevant_chunks = relevant_chunks[
        :n_results
    ]

    return relevant_chunks