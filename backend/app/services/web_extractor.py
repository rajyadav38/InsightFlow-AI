import httpx
from bs4 import BeautifulSoup


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/142.0.0.0 Safari/537.36"
)


def fetch_web_page(url: str) -> str:
    """
    Fetch the HTML content of a web page.
    """

    if not url or not url.strip():
        raise ValueError("URL cannot be empty")

    try:
        response = httpx.get(
            url,
            headers={
                "User-Agent": USER_AGENT
            },
            timeout=20.0,
            follow_redirects=True,
        )

        response.raise_for_status()

    except httpx.HTTPError as error:
        raise ValueError(
            f"Failed to fetch URL: {error}"
        )

    return response.text


def extract_text_from_html(html: str) -> str:
    """
    Extract readable text from an HTML document.
    """

    if not html or not html.strip():
        raise ValueError("HTML content is empty")

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    # Remove elements that normally do not contain
    # useful article content.
    for element in soup(
        [
            "script",
            "style",
            "noscript",
            "nav",
            "footer",
            "header",
            "aside",
        ]
    ):
        element.decompose()

    text = soup.get_text(
        separator="\n",
        strip=True,
    )

    if not text:
        raise ValueError(
            "No readable text could be extracted from the page"
        )

    return text


def extract_text_from_url(url: str) -> str:
    """
    Fetch a URL and extract readable text.
    """

    html = fetch_web_page(url)

    return extract_text_from_html(html)