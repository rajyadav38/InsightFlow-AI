def build_context(chunks: list[dict]) -> str:
    """
    Build a clean context string from retrieved chunks.
    """

    if not chunks:
        return ""

    context_parts = []

    for index, chunk in enumerate(chunks, start=1):
        context_parts.append(
            f"SOURCE {index}:\n"
            f"{chunk['text']}"
        )

    return "\n\n".join(context_parts)