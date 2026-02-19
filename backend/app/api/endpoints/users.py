from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import (  # We need to create security.py
    get_current_user, get_password_hash)
from app.db.session import db
from app.models.user import UserProfile, UserProfileUpdate

router = APIRouter()


@router.get("/me", response_model=UserProfile)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfile)
async def update_user_me(
    user_update: UserProfileUpdate, current_user: dict = Depends(get_current_user)
):
    update_data = {k: v for k, v in user_update.model_dump(exclude_unset=True).items()}
    if not update_data:
        return current_user

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})

    updated_user = await db.users.find_one({"id": current_user["id"]})
    return updated_user
