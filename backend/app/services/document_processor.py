from app.services.document_parser import extract_text
from app.services.file_storage import (
    download_file,
    upload_file,
)


def process_document(
    storage_path: str,
    source_type: str,
    processed_storage_path: str,
) -> dict:

    # Download original document
    file_bytes = download_file(storage_path)

    if not file_bytes:
        raise ValueError(
            "Downloaded file is empty"
        )

    # Extract text
    text = extract_text(
        file_bytes=file_bytes,
        source_type=source_type,
    )

    if not text.strip():
        raise ValueError(
            "No text could be extracted from the document"
        )

    # Convert extracted text to bytes
    text_bytes = text.encode(
        "utf-8"
    )

    # Store extracted text in Supabase
    upload_file(
        file_bytes=text_bytes,
        storage_path=processed_storage_path,
        content_type="text/plain; charset=utf-8",
    )

    return {
        "processed_storage_path": processed_storage_path,
        "character_count": len(text),
    }