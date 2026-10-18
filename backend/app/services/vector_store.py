
import os
import chromadb
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Chroma Cloud
chroma_client = chromadb.CloudClient(
    api_key=os.environ["CHROMA_API_KEY"],
    tenant=os.environ["CHROMA_TENANT"],
    database=os.environ["CHROMA_DATABASE"],
)

# Gemini embeddings
gemini_client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"]
)

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSIONS = 768


def get_collection():
    """Get the collection for Gemini embeddings."""
    return chroma_client.get_or_create_collection(
        name="insightflow_gemini_768",
        metadata={"hnsw:space": "cosine"},
    )


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate hosted embeddings without loading a local model."""
    if not texts:
        return []

    response = gemini_client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=texts,
        config={
            "output_dimensionality": EMBEDDING_DIMENSIONS,
        },
    )

    if not response.embeddings:
        raise RuntimeError("Gemini returned no embeddings")

    embeddings = [item.values for item in response.embeddings]

    if len(embeddings) != len(texts):
        raise RuntimeError("Embedding count does not match text count")

    return embeddings


def add_chunks(
    chunks: list[str],
    source_id: str,
    project_id: str,
) -> dict:
    """Store document chunks with explicit Gemini embeddings."""
    chunks = [chunk for chunk in chunks if chunk and chunk.strip()]

    if not chunks:
        raise ValueError("Cannot store empty chunks")

    collection = get_collection()
    ids = [f"{source_id}_{i}" for i in range(len(chunks))]

    metadatas = [
        {
            "source_id": source_id,
            "project_id": project_id,
            "chunk_index": i,
        }
        for i in range(len(chunks))
    ]

    embeddings = []

    # Batch embedding requests to limit memory and request size.
    batch_size = 16
    for start in range(0, len(chunks), batch_size):
        batch = chunks[start:start + batch_size]
        embeddings.extend(generate_embeddings(batch))

    # Remove old chunks for this source if the new version is shorter.
    existing = collection.get(
        where={"source_id": source_id},
        include=[],
    )
    existing_ids = existing.get("ids", [])
    stale_ids = [item_id for item_id in existing_ids if item_id not in ids]

    if stale_ids:
        collection.delete(ids=stale_ids)

    collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    return {
        "collection_name": collection.name,
        "chunk_count": len(chunks),
    }


def has_source_chunks(source_id: str) -> bool:
    collection = get_collection()
    results = collection.get(
        where={"source_id": source_id},
        limit=1,
        include=[],
    )
    return bool(results["ids"])


def search_chunks(
    query: str,
    project_id: str,
    n_results: int = 5,
    source_ids: list[str] | None = None,
) -> dict:
    """Search project chunks using the same Gemini embedding model."""
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if n_results <= 0:
        raise ValueError("n_results must be greater than 0")

    collection = get_collection()

    if source_ids:
        where_filter = {
            "$and": [
                {"project_id": project_id},
                {"source_id": {"$in": list(set(source_ids))}},
            ]
        }
    else:
        where_filter = {"project_id": project_id}

    collection_count = collection.count()

    if collection_count == 0:
        return {
            "ids": [[]],
            "documents": [[]],
            "metadatas": [[]],
            "distances": [[]],
        }

    query_embedding = generate_embeddings([query])[0]

    return collection.query(
        query_embeddings=[query_embedding],
        n_results=min(n_results, collection_count),
        where=where_filter,
    )
