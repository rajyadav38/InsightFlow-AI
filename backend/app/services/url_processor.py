from app.services.text_chunker import chunk_text
from app.services.vector_store import add_chunks
from app.services.web_extractor import extract_text_from_url


def process_url(
    url: str,
    source_id: str,
    project_id: str,
) -> dict:
    """
    Fetch a web page, extract its text,
    create chunks, and store them in ChromaDB.
    """

    if not url or not url.strip():
        raise ValueError("URL cannot be empty")

    # ========================================================
    # STEP 1: EXTRACT WEB PAGE TEXT
    # ========================================================

    text = extract_text_from_url(url)

    if not text.strip():
        raise ValueError(
            "No text could be extracted from the URL"
        )

    # ========================================================
    # STEP 2: CREATE CHUNKS
    # ========================================================

    chunks = chunk_text(text)

    # ========================================================
    # STEP 3: STORE CHUNKS IN CHROMADB
    # ========================================================

    vector_result = add_chunks(
        chunks=chunks,
        source_id=source_id,
        project_id=project_id,
    )

    return {
        "character_count": len(text),
        "chunk_count": vector_result["chunk_count"],
    }