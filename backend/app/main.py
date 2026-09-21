from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.projects import router as projects_router
from app.api.sources import router as sources_router
from app.api import chat
from app.api import conversations
from fastapi import HTTPException
from app.api import generation
from app.api import generated

from app.services.file_storage import upload_file

from app.db.database import (
    connect_to_mongodb,
    close_mongodb_connection,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()

    yield

    await close_mongodb_connection()


app = FastAPI(
    title="InsightFlow AI",
    description="Agentic Knowledge Intelligence Platform",
    version="0.1.0",
    lifespan=lifespan,
)


app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(sources_router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(generation.router)
app.include_router(generated.router)
@app.get("/")
async def root():
    return {
        "message": "Welcome to InsightFlow AI",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
    }

