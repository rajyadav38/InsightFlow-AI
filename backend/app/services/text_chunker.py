from langchain_text_splitters import RecursiveCharacterTextSplitter


CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def chunk_text(text: str) -> list[str]:
    """
    Split extracted document text into overlapping chunks.
    """

    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=[
            "\n\n",
            "\n",
            ". ",
            " ",
            "",
        ],
    )

    chunks = splitter.split_text(text)

    return chunks