import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import (get_current_user, get_optional_user,
                               require_admin)
from app.db.session import db
from app.models.course import Lab, LabCreate
from app.services.analytics import log_access

router = APIRouter()


@router.get("/labs")
async def get_labs(
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    published_only: bool = True,
    page: int = 1,
    limit: int = 12,
    user: dict = Depends(get_optional_user),
):
    query = {}
    if published_only:
        query["is_published"] = True
    if difficulty:
        query["difficulty"] = difficulty
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    total = await db.labs.count_documents(query)
    skip = (page - 1) * limit
    labs = await db.labs.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)

    if user:
        await log_access(user["id"], "lab", "list", "view")

    from app.core.responses import paginated_response

    return paginated_response(labs, total, page, limit)


@router.get("/labs/{slug}")
async def get_lab(slug: str, user: dict = Depends(get_optional_user)):
    lab = await db.labs.find_one({"slug": slug}, {"_id": 0})
    if not lab:
        lab = await db.labs.find_one({"id": slug}, {"_id": 0})

    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    if user:
        await log_access(user["id"], "lab", lab["id"], "view")

    return lab
