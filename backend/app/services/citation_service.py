from bson import ObjectId

from app.db.database import database


async def resolve_sources(
    source_ids: list[str],
    project_id: str,
) -> dict[str, dict]:
    """
    Resolve ChromaDB source IDs to MongoDB source metadata.
    """

    if not source_ids:
        return {}

    object_ids = [
        ObjectId(source_id)
        for source_id in source_ids
        if ObjectId.is_valid(source_id)
    ]

    if not object_ids:
        return {}

    cursor = database.sources.find(
        {
            "_id": {"$in": object_ids},
            "project_id": project_id,
        }
    )

    sources = await cursor.to_list(length=len(object_ids))

    return {
        str(source["_id"]): {
            "source_id": str(source["_id"]),
            "title": source["title"],
            "type": source["type"],
            "filename": source.get("filename"),
            "url": source.get("url"),
        }
        for source in sources
    }