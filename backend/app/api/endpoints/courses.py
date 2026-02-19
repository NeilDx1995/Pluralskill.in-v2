from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from app.models.course import Course, CourseCreate, CourseUpdate
from app.models.progress import CourseProgress, MarkModuleCompleteRequest
from app.core.security import get_current_user, require_admin, get_optional_user
from app.services.analytics import log_access
from app.services.progress import calculate_course_progress, check_and_issue_certificate
from app.db.session import db
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.get("/")
async def get_courses(
    published_only: bool = True,
    search: Optional[str] = None,
    category: Optional[str] = None,
    level: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
    user: dict = Depends(get_optional_user)
):
    query = {}
    if published_only:
        query["is_published"] = True
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    if level:
        query["level"] = level
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db.courses.count_documents(query)
    skip = (page - 1) * limit
    courses = await db.courses.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    if user:
        await log_access(user["id"], "course", "list", "view")
    
    from app.core.responses import paginated_response
    return paginated_response(courses, total, page, limit)

@router.get("/{course_id}")
async def get_course(course_id: str, user: dict = Depends(get_optional_user)):
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    if user:
        await log_access(user["id"], "course", course_id, "view")
        
    return course

@router.post("/")
async def create_course(course_in: CourseCreate, user: dict = Depends(require_admin)):
    course_doc = course_in.model_dump()
    course_doc["id"] = str(uuid.uuid4())
    course_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    course_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    course_doc["created_by"] = user["id"]
    course_doc["enrolled_count"] = 0
    
    await db.courses.insert_one(course_doc)
    return course_doc

@router.post("/{course_id}/enroll")
async def enroll_course(course_id: str, user: dict = Depends(get_current_user)):
    course = await db.courses.find_one({"id": course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Check if already enrolled
    if course_id in user.get("enrolled_courses", []):
        return {"message": "Already enrolled"}
        
    # Add to user enrolled_courses
    await db.users.update_one(
        {"id": user["id"]},
        {"$addToSet": {"enrolled_courses": course_id}}
    )
    
    # Initialize progress
    now = datetime.now(timezone.utc).isoformat()
    progress_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "course_id": course_id,
        "modules_progress": [],
        "overall_progress": 0,
        "started_at": now,
        "last_accessed": now,
        "completed": False
    }
    await db.course_progress.insert_one(progress_doc)
    
    # Increment course enrolled count
    await db.courses.update_one(
        {"id": course_id},
        {"$inc": {"enrolled_count": 1}}
    )
    
    await log_access(user["id"], "course", course_id, "enroll")
    return {"message": "Successfully enrolled"}

@router.post("/{course_id}/progress")
async def update_progress(
    course_id: str, 
    progress_data: MarkModuleCompleteRequest, 
    user: dict = Depends(get_current_user)
):
    # Verify enrollment
    if course_id not in user.get("enrolled_courses", []):
         raise HTTPException(status_code=403, detail="Not enrolled in this course")
         
    now = datetime.now(timezone.utc).isoformat()
    
    # Update module progress
    await db.course_progress.update_one(
        {"user_id": user["id"], "course_id": course_id},
        {
            "$pull": {"modules_progress": {"module_id": progress_data.module_id}},
            "$set": {"last_accessed": now}
        }
    )
    
    await db.course_progress.update_one(
        {"user_id": user["id"], "course_id": course_id},
        {
            "$push": {
                "modules_progress": {
                    "module_id": progress_data.module_id,
                    "completed": True,
                    "completed_at": now,
                    "time_spent_minutes": progress_data.time_spent_minutes
                }
            }
        }
    )
    
    # Recalculate overall progress
    stats = await calculate_course_progress(user["id"], course_id)
    
    await db.course_progress.update_one(
        {"user_id": user["id"], "course_id": course_id},
        {"$set": {"overall_progress": stats["progress"], "completed": stats["completed"]}}
    )
    
    # Check for certificate
    cert_status = await check_and_issue_certificate(user["id"], course_id)
    
    return {
        "progress": stats["progress"], 
        "completed": stats["completed"],
        "certificate": cert_status
    }
