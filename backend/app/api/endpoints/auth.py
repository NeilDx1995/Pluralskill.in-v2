import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import (create_token, get_current_user, hash_password,
                               verify_password)
from app.db.session import db
from app.models.user import UserCreate, UserLogin

router = APIRouter()


@router.post("/register")
@router.post("/signup")
async def register(user_in: UserCreate):
    existing_user = await db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user_in.password)
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user_in.email,
        "password_hash": hashed_pw,
        "first_name": user_in.first_name,
        "last_name": user_in.last_name,
        "role": "learner",
        "created_at": now,
        "updated_at": now,
    }

    await db.users.insert_one(user_doc)

    jwt_token = create_token(user_doc["id"], user_doc["role"])
    return {
        "token": jwt_token,
        "access_token": jwt_token,
        "token_type": "bearer",
        "role": user_doc["role"],
        "user_id": user_doc["id"],
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "first_name": user_doc["first_name"],
            "last_name": user_doc["last_name"],
            "role": user_doc["role"],
        },
    }


@router.post("/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    jwt_token = create_token(user["id"], user["role"])
    return {
        "token": jwt_token,
        "access_token": jwt_token,
        "token_type": "bearer",
        "role": user["role"],
        "user_id": user["id"],
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "role": user["role"],
        },
    }


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_data = await db.users.find_one(
        {"id": user["id"]}, {"_id": 0, "password_hash": 0}
    )
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data


@router.post("/refresh")
async def refresh_token(user: dict = Depends(get_current_user)):
    """Issue a new token from a valid existing token (extends session)."""
    new_token = create_token(user["id"], user["role"])
    return {"token": new_token, "access_token": new_token, "token_type": "bearer"}


@router.post("/forgot-password")
async def forgot_password(data: dict):
    """Request password reset — generates a reset token (stored in DB)."""
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal whether email exists
        return {"message": "If the email exists, a reset link has been sent."}

    import secrets

    reset_token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)

    await db.users.update_one(
        {"email": email},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": expires.isoformat(),
            }
        },
    )

    # In production, send email with reset link containing the token
    # For now, log it (visible in dev only)
    import logging

    logging.getLogger("app").info(f"Password reset token for {email}: {reset_token}")

    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(data: dict):
    """Confirm password reset with token and new password."""
    token = data.get("token")
    new_password = data.get("password")

    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and password are required")

    if len(new_password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters"
        )

    user = await db.users.find_one({"reset_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Check expiry
    expires = user.get("reset_token_expires", "")
    if expires and datetime.fromisoformat(expires) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    hashed_pw = hash_password(new_password)
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"password_hash": hashed_pw},
            "$unset": {"reset_token": "", "reset_token_expires": ""},
        },
    )

    return {"message": "Password reset successful"}
