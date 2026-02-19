from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.services.analytics import log_access
from app.services.ai import generate_learning_path
from app.db.session import db
from datetime import datetime, timezone
import uuid

router = APIRouter()

class GeneratePathRequest(BaseModel):
    skill_name: str
    current_level: str = "beginner"
    industry: str = "Technology"
    goal: str = "Master the skill"  # Optional with default

@router.post("/open-source/generate")
async def create_learning_path(request: GeneratePathRequest, user: dict = Depends(get_current_user)):
    path_data = await generate_learning_path(
        skill_name=request.skill_name,
        current_level=request.current_level,
        industry=request.industry,
        goal=request.goal
    )
    
    path_data["id"] = str(uuid.uuid4())
    path_data["user_id"] = user["id"]
    path_data["created_at"] = datetime.now(timezone.utc).isoformat()
    if "generated_by" not in path_data:
        path_data["generated_by"] = "gemini"
    
    # Save to DB for retrieval later
    await db.learning_paths.insert_one(path_data)
    
    await log_access(user["id"], "learning_path", request.skill_name, "generate")
    
    # Remove MongoDB _id before returning
    path_data.pop("_id", None)
    return path_data

@router.get("/open-source/paths")
async def get_learning_paths(user: dict = Depends(get_current_user)):
    paths = await db.learning_paths.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return paths

@router.get("/open-source/paths/{path_id}")
async def get_learning_path_by_id(path_id: str, user: dict = Depends(get_current_user)):
    path = await db.learning_paths.find_one(
        {"id": path_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return path

@router.delete("/open-source/paths/{path_id}")
async def delete_learning_path(path_id: str, user: dict = Depends(get_current_user)):
    result = await db.learning_paths.delete_one({"id": path_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return {"message": "Learning path deleted"}
