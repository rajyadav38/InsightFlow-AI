import chromadb


# ============================================================
# CHROMADB CLIENT
# ============================================================

chroma_client = chromadb.PersistentClient(
    path="./chroma_data"
)


# ============================================================
# COLLECTION
# ============================================================

def get_collection():
    """
    Get or create the main InsightFlow document collection.
    """

    return chroma_client.get_or_create_collection(
        name="insightflow_documents"
    )


# ============================================================
# ADD CHUNKS
# ============================================================

def add_chunks(
    chunks: list[str],
    source_id: str,
    project_id: str,
) -> dict:
    """
    Store document chunks in ChromaDB.

    ChromaDB automatically creates embeddings for the
    documents using its configured embedding function.
    """

    if not chunks:
        raise ValueError(
            "Cannot store empty chunks"
        )

    collection = get_collection()

    ids = [
        f"{source_id}_{index}"
        for index in range(len(chunks))
    ]

    metadatas = [
        {
            "source_id": source_id,
            "project_id": project_id,
            "chunk_index": index,
        }
        for index in range(len(chunks))
    ]

    collection.upsert(
        ids=ids,
        documents=chunks,
        metadatas=metadatas,
    )

    return {
        "collection_name": collection.name,
        "chunk_count": len(chunks),
    }


def has_source_chunks(
    source_id: str,
) -> bool:
    """
    Check whether chunks for a source already exist
    in ChromaDB.
    """

    collection = get_collection()

    results = collection.get(
        where={
            "source_id": source_id,
        },
        limit=1,
    )

    return len(results["ids"]) > 0


# ============================================================
# QUERY CHUNKS
# ============================================================

def search_chunks(
    query: str,
    project_id: str,
    n_results: int = 5,
) -> dict:
    """
    Search for the most relevant document chunks
    inside a project.
    """

    if not query.strip():
        raise ValueError(
            "Query cannot be empty"
        )

    collection = get_collection()

    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        where={
            "project_id": project_id,
        },
    )

    return results