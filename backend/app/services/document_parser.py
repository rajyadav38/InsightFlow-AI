def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode(
        "utf-8",
        errors="ignore",
    )


def extract_text(
    file_bytes: bytes,
    source_type: str,
) -> str:

    if source_type == "txt":
        return extract_text_from_txt(file_bytes)

    raise ValueError(
        f"Unsupported source type: {source_type}"
    )