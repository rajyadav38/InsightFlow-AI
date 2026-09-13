from pymongo import AsyncMongoClient
from pymongo.server_api import ServerApi

from app.core.config import settings


client = AsyncMongoClient(
    settings.MONGODB_URI,
    server_api=ServerApi(
        version="1",
        strict=True,
        deprecation_errors=True,
    ),
)

database = client[settings.MONGODB_DB_NAME]


async def connect_to_mongodb():
    await client.admin.command("ping")
    

    await database.users.create_index(
        "email",
        unique=True,
    )

    await database.projects.create_index(
        [
            ("user_id", 1),
            ("created_at", -1),
        ]
    )

    await database.sources.create_index(
        [
            ("project_id", 1),
            ("created_at", -1),
        ]
    )

    print("✅ Connected to MongoDB Atlas")


async def close_mongodb_connection():
    await client.close()
    print("🔌 MongoDB connection closed")