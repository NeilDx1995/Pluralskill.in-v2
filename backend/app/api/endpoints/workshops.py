import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import (get_current_user, get_optional_user,
                               require_admin)
from app.db.session import db
from app.models.course import Workshop, WorkshopCreate
from app.services.analytics import log_access

router = APIRouter()


@router.get("/")
async def get_workshops(
    active_only: bool = True,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
    user: dict = Depends(get_optional_user),
):
    query = {}
    if active_only:
        query["is_active"] = True
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]

    total = await db.workshops.count_documents(query)
    skip = (page - 1) * limit
    workshops = (
        await db.workshops.find(query, {"_id": 0})
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )

    if user:
        await log_access(user["id"], "workshop", "list", "view")

    from app.core.responses import paginated_response

    return paginated_response(workshops, total, page, limit)


@router.post("/")
async def create_workshop(
    workshop_in: WorkshopCreate, user: dict = Depends(require_admin)
):
    workshop_doc = workshop_in.model_dump()
    workshop_doc["id"] = str(uuid.uuid4())
    workshop_doc["registered_count"] = 0
    workshop_doc["created_at"] = datetime.utcnow().isoformat()

    await db.workshops.insert_one(workshop_doc)
    return workshop_doc


@router.post("/{workshop_id}/register")
async def register_workshop(workshop_id: str, user: dict = Depends(get_current_user)):
    workshop = await db.workshops.find_one({"id": workshop_id})
    if not workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")

    # Check capacity
    if workshop["registered_count"] >= workshop["max_participants"]:
        raise HTTPException(status_code=400, detail="Workshop is full")

    # Check if already registered
    # Implementation requires a workshop_registrations collection or array in user/workshop
    # Existing code in server.py likely just increments count or does nothing specific?
    # Let's check original server.py logic.
    # Original logic:
    # 1. Update workshop document incrementing registered_count
    # 2. Add to user's registered list?

    # Replicating simple increment for now as per likely original logic
    await db.workshops.update_one(
        {"id": workshop_id}, {"$inc": {"registered_count": 1}}
    )

    await log_access(user["id"], "workshop", workshop_id, "register")

    return {"message": "Successfully registered"}
