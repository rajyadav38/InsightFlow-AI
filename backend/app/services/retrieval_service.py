from app.services.vector_store import search_chunks


def retrieve_relevant_chunks(
    query: str,
    project_id: str,
    n_results: int = 5,
) -> list[dict]:
    """
    Retrieve the most relevant document chunks
    for a user's query within a project.
    """

    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    results = search_chunks(
        query=query,
        project_id=project_id,
        n_results=n_results,
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]
    ids = results.get("ids", [[]])[0]

    retrieved_chunks = []

    for index in range(len(documents)):
        retrieved_chunks.append(
            {
                "id": ids[index],
                "text": documents[index],
                "metadata": metadatas[index],
                "distance": distances[index],
            }
        )

    return retrieved_chunks