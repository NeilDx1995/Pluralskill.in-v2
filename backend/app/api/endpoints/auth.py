from fastapi import APIRouter, HTTPException, Depends, status
from app.models.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password, create_token, get_current_user
from app.db.session import db
from datetime import datetime, timezone
import uuid

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
        "updated_at": now
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
            "role": user_doc["role"]
        }
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
            "role": user["role"]
        }
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_data = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data
