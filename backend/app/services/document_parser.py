from io import BytesIO

from docx import Document
from pypdf import PdfReader


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode(
        "utf-8",
        errors="ignore",
    )


def extract_text_from_pdf(file_bytes: bytes) -> str:
    pdf_file = BytesIO(file_bytes)
    reader = PdfReader(pdf_file)

    pages = []

    for page in reader.pages:
        text = page.extract_text()

        if text:
            pages.append(text.strip())

    return "\n\n".join(pages)


def extract_text_from_docx(file_bytes: bytes) -> str:
    docx_file = BytesIO(file_bytes)
    document = Document(docx_file)

    paragraphs = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    return "\n\n".join(paragraphs)


def extract_text(
    file_bytes: bytes,
    source_type: str,
) -> str:

    if source_type == "txt":
        return extract_text_from_txt(file_bytes)

    if source_type == "pdf":
        return extract_text_from_pdf(file_bytes)

    if source_type == "docx":
        return extract_text_from_docx(file_bytes)

    raise ValueError(
        f"Unsupported source type: {source_type}"
    )