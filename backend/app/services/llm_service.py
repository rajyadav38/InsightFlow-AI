import time

from google import genai
from google.genai import types
from google.genai.errors import ServerError

from app.core.config import settings


client = genai.Client(
    api_key=settings.GEMINI_API_KEY
)


MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


def generate_text(prompt: str) -> str:
    if not prompt or not prompt.strip():
        raise ValueError(
            "Prompt cannot be empty"
        )

    last_error = None

    for attempt in range(MAX_RETRIES):

        try:
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

        except ServerError as error:
            last_error = error

            print(
                f"⚠️ Gemini server error "
                f"(attempt {attempt + 1}/{MAX_RETRIES})"
            )

            if attempt < MAX_RETRIES - 1:
                time.sleep(
                    RETRY_DELAY_SECONDS
                    * (attempt + 1)
                )

        except Exception:
            raise

    raise last_error