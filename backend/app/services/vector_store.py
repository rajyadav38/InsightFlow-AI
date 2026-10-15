
import chromadb

# ============================================================
# CHROMADB CLIENT
# ============================================================

chroma_client = chromadb.PersistentClient(path="./chroma_data")


# ============================================================
# COLLECTION
# ============================================================

def get_collection():
    """Get or create the main InsightFlow document collection."""
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
    """Store document chunks in ChromaDB."""

    if not chunks:
        raise ValueError("Cannot store empty chunks")

    collection = get_collection()

    ids = [f"{source_id}_{index}" for index in range(len(chunks))]

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


# ============================================================
# CHECK SOURCE CHUNKS
# ============================================================

def has_source_chunks(source_id: str) -> bool:
    """Check whether chunks for a source exist in ChromaDB."""

    collection = get_collection()

    results = collection.get(
        where={"source_id": source_id},
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
    source_ids: list[str] | None = None,
) -> dict:
    """
    Search chunks within a project.

    If source_ids is provided, only search those sources.
    If source_ids is None or empty, search the entire project.
    """

    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if n_results <= 0:
        raise ValueError("n_results must be greater than 0")

    collection = get_collection()

    # Keep existing project-wide retrieval as the default.
    if source_ids:
        where_filter = {
            "$and": [
                {"project_id": project_id},
                {"source_id": {"$in": list(set(source_ids))}},
            ]
        }
    else:
        where_filter = {"project_id": project_id}

    # Avoid requesting more results than available in the collection.
    collection_count = collection.count()

    if collection_count == 0:
        return {
            "ids": [[]],
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]],
        }

    return collection.query(
        query_texts=[query],
        n_results=min(n_results, collection_count),
        where=where_filter,
    )
