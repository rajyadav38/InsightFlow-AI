from google import genai
from google.genai import types

from app.core.config import settings


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


# ============================================================
# TEXT GENERATION
# ============================================================

def generate_text(prompt: str) -> str:
    """
    Generate text using the configured Gemini model.
    """

    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty")

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            automatic_function_calling=(
                types.AutomaticFunctionCallingConfig(
                    disable=True
                )
            ),
            http_options=types.HttpOptions(
                timeout=30_000
            ),
        ),
    )

    if not response.text:
        raise ValueError(
            "Gemini returned an empty response"
        )

    return response.text