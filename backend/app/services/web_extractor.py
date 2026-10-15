
import re
import httpx
from bs4 import BeautifulSoup


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/142.0.0.0 Safari/537.36"
)

# Common interface text that should not become source evidence.
NOISE_LINES = {
    "log in",
    "sign in",
    "sign up",
    "post",
    "posts",
    "reply",
    "repost",
    "like",
    "share",
    "show more",
    "see more",
    "read more",
    "loading",
}


def fetch_web_page(url: str) -> str:
    """Fetch the HTML content of a web page."""

    if not url or not url.strip():
        raise ValueError("URL cannot be empty")

    try:
        response = httpx.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=20.0,
            follow_redirects=True,
        )
        response.raise_for_status()

    except httpx.HTTPError as error:
        raise ValueError(f"Failed to fetch URL: {error}") from error

    return response.text


def _get_meta_content(soup: BeautifulSoup, *names: str) -> str:
    """Return the first non-empty matching metadata value."""

    for name in names:
        tag = (
            soup.find("meta", attrs={"property": name})
            or soup.find("meta", attrs={"name": name})
        )

        if tag:
            content = tag.get("content", "").strip()
            if content:
                return content

    return ""


def _clean_text(text: str) -> str:
    """Normalize text and remove duplicate or obvious UI lines."""

    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+", " ", text)

    cleaned_lines = []
    seen_lines = set()

    for raw_line in text.splitlines():
        line = raw_line.strip()

        if not line:
            continue

        normalized = re.sub(r"\s+", " ", line).strip()
        comparison = normalized.casefold()

        if comparison in NOISE_LINES:
            continue

        # Avoid repeating the exact same line in a single extraction.
        if comparison in seen_lines:
            continue

        seen_lines.add(comparison)
        cleaned_lines.append(normalized)

    return "\n".join(cleaned_lines).strip()


def extract_text_from_html(html: str, url: str = "") -> str:
    """Extract readable text from HTML, prioritizing article/post content."""

    if not html or not html.strip():
        raise ValueError("HTML content is empty")

    soup = BeautifulSoup(html, "html.parser")

    is_x_post = (
        "x.com/" in url.lower()
        or "twitter.com/" in url.lower()
    )

    # Social posts often expose the original post in metadata.
    if is_x_post:
        title = _get_meta_content(
            soup,
            "og:title",
            "twitter:title",
        )

        description = _get_meta_content(
            soup,
            "og:description",
            "twitter:description",
            "description",
        )

        metadata_text = _clean_text(
            "\n".join(part for part in [title, description] if part)
        )

        if metadata_text:
            return metadata_text

    # Remove non-content elements before article extraction.
    for element in soup([
        "script",
        "style",
        "noscript",
        "nav",
        "footer",
        "header",
        "aside",
        "form",
        "button",
        "svg",
    ]):
        element.decompose()

    # Prefer semantic article containers when available.
    content = (
        soup.find("article")
        or soup.find("main")
        or soup.find(attrs={"role": "main"})
        or soup.body
        or soup
    )

    text = content.get_text(separator="\n", strip=True)
    text = _clean_text(text)

    if not text:
        raise ValueError(
            "No readable text could be extracted from the page"
        )

    return text


def extract_text_from_url(url: str) -> str:
    """Fetch a URL and extract readable text."""

    html = fetch_web_page(url)
    return extract_text_from_html(html, url=url)
