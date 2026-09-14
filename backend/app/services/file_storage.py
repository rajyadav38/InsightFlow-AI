from supabase import create_client, Client

from app.core.config import settings


supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY,
)


def upload_file(
    file_bytes: bytes,
    storage_path: str,
    content_type: str,
) -> dict:
    response = (
        supabase.storage
        .from_(settings.SUPABASE_STORAGE_BUCKET)
        .upload(
            path=storage_path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "false",
            },
        )
    )

    return {
        "storage_path": storage_path,
        "response": response,
    }


def delete_file(storage_path: str):
    return (
        supabase.storage
        .from_(settings.SUPABASE_STORAGE_BUCKET)
        .remove([storage_path])
    )


def download_file(storage_path: str) -> bytes:
    return (
        supabase.storage
        .from_(settings.SUPABASE_STORAGE_BUCKET)
        .download(storage_path)
    )