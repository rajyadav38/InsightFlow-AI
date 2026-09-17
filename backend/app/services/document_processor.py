from app.services.document_parser import extract_text
from app.services.file_storage import (
    download_file,
    upload_file,
)
from app.services.text_chunker import chunk_text
from app.services.vector_store import add_chunks


def process_document(
    storage_path: str,
    source_type: str,
    processed_storage_path: str,
    source_id: str,
    project_id: str,
) -> dict:

    # ========================================================
    # DOWNLOAD ORIGINAL DOCUMENT
    # ========================================================

    file_bytes = download_file(
        storage_path
    )

    if not file_bytes:
        raise ValueError(
            "Downloaded file is empty"
        )

    # ========================================================
    # EXTRACT TEXT
    # ========================================================

    text = extract_text(
        file_bytes=file_bytes,
        source_type=source_type,
    )

    if not text.strip():
        raise ValueError(
            "No text could be extracted from the document"
        )

    # ========================================================
    # STORE PROCESSED TEXT
    # ========================================================

    text_bytes = text.encode("utf-8")

    upload_file(
        file_bytes=text_bytes,
        storage_path=processed_storage_path,
        content_type="text/plain; charset=utf-8",
        upsert=True,
    )

    # ========================================================
    # CHUNK TEXT
    # ========================================================

    chunks = chunk_text(text)

    # ========================================================
    # STORE CHUNKS IN CHROMADB
    # ========================================================

    vector_result = add_chunks(
        chunks=chunks,
        source_id=source_id,
        project_id=project_id,
    )

    return {
        "processed_storage_path": processed_storage_path,
        "character_count": len(text),
        "chunk_count": vector_result["chunk_count"],
    }

def sync_processed_document_to_vector_store(
    processed_storage_path: str,
    source_id: str,
    project_id: str,
) -> dict:
    """
    Read an already processed text file from Supabase,
    create chunks, and store them in ChromaDB.
    """

    # Download processed text
    text_bytes = download_file(
        processed_storage_path
    )

    if not text_bytes:
        raise ValueError(
            "Processed document is empty"
        )

    # Convert bytes to text
    text = text_bytes.decode(
        "utf-8",
        errors="ignore",
    )

    if not text.strip():
        raise ValueError(
            "Processed document contains no text"
        )

    # Create chunks
    chunks = chunk_text(text)

    # Store chunks in ChromaDB
    vector_result = add_chunks(
        chunks=chunks,
        source_id=source_id,
        project_id=project_id,
    )

    return {
        "character_count": len(text),
        "chunk_count": vector_result["chunk_count"],
    }