from fastapi import APIRouter, HTTPException, status

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.database import database
from app.models.user import (
    create_user_document,
    serialize_user,
)
from app.schemas.auth import (
    TokenResponse,
    UserLogin,
    UserRegister,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(user: UserRegister):

    existing_user = await database.users.find_one(
        {"email": user.email}
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    hashed_password = hash_password(user.password)

    user_document = create_user_document(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
    )

    result = await database.users.insert_one(
        user_document
    )

    created_user = await database.users.find_one(
        {"_id": result.inserted_id}
    )

    access_token = create_access_token(
        {"sub": str(created_user["_id"])}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(created_user),
    }


@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(user: UserLogin):

    existing_user = await database.users.find_one(
        {"email": user.email}
    )

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(
        user.password,
        existing_user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        {"sub": str(existing_user["_id"])}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(existing_user),
    }