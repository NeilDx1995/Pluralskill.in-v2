import logging
import uuid
from datetime import datetime, timezone

from app.db.session import db

logger = logging.getLogger(__name__)


def generate_certificate_number():
    """Generate unique certificate number like PS-2026-XXXX"""
    year = datetime.now().year
    random_part = uuid.uuid4().hex[:8].upper()
    return f"PS-{year}-{random_part}"


async def calculate_course_progress(user_id: str, course_id: str) -> dict:
    """Calculate overall course progress including modules, quiz, and assignments"""
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        return {"progress": 0, "completed": False}

    progress_doc = await db.course_progress.find_one(
        {"user_id": user_id, "course_id": course_id}, {"_id": 0}
    )

    if not progress_doc:
        return {"progress": 0, "completed": False}

    total_items = 0
    completed_items = 0

    # Module completion (50% weight)
    modules = course.get("modules", [])
    if modules:
        total_items += len(modules)
        modules_progress = {
            m["module_id"]: m for m in progress_doc.get("modules_progress", [])
        }
        completed_items += sum(
            1
            for m in modules
            if modules_progress.get(m["id"], {}).get("completed", False)
        )

    # Quiz completion (30% weight) - only if course has tests
    tests = course.get("tests", [])
    if tests:
        total_items += 1  # Quiz counts as 1 item
        quiz_progress = progress_doc.get("quiz_progress")
        if quiz_progress and quiz_progress.get("passed"):
            completed_items += 1

    # Assignment completion (20% weight)
    assignments = await db.assignments.find(
        {"course_id": course_id, "is_required": True}
    ).to_list(100)
    if assignments:
        total_items += len(assignments)
        for assignment in assignments:
            submission = await db.submissions.find_one(
                {
                    "assignment_id": assignment["id"],
                    "user_id": user_id,
                    "grade": {"$ne": None},
                }
            )
            if submission:
                completed_items += 1

    progress = (completed_items / total_items * 100) if total_items > 0 else 0
    completed = progress >= 100

    return {"progress": round(progress, 1), "completed": completed}


async def check_and_issue_certificate(user_id: str, course_id: str):
    """Check if user qualifies for certificate and issue if so"""
    # Check if certificate already exists
    existing_cert = await db.certificates.find_one(
        {"user_id": user_id, "course_id": course_id}, {"_id": 0}
    )
    if existing_cert:
        return existing_cert

    # Get course and progress
    course = await db.courses.find_one({"id": course_id}, {"_id": 0})
    if not course:
        return None

    progress_doc = await db.course_progress.find_one(
        {"user_id": user_id, "course_id": course_id}, {"_id": 0}
    )
    if not progress_doc:
        return None

    # Check all modules completed
    modules = course.get("modules", [])
    if modules:
        modules_progress = {
            m["module_id"]: m for m in progress_doc.get("modules_progress", [])
        }
        all_modules_complete = all(
            modules_progress.get(m["id"], {}).get("completed", False) for m in modules
        )
        if not all_modules_complete:
            return None

    # Check quiz passed (if exists)
    quiz_score = 0
    tests = course.get("tests", [])
    if tests:
        quiz_progress = progress_doc.get("quiz_progress")
        if not quiz_progress or not quiz_progress.get("passed"):
            return None
        quiz_score = quiz_progress.get("best_score", 0)

    # Check required assignments graded
    assignments = await db.assignments.find(
        {"course_id": course_id, "is_required": True}
    ).to_list(100)
    for assignment in assignments:
        submission = await db.submissions.find_one(
            {
                "assignment_id": assignment["id"],
                "user_id": user_id,
                "grade": {"$ne": None},
            }
        )
        if not submission:
            return None

    # Issue certificate
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return None

    now = datetime.now(timezone.utc).isoformat()
    cert_doc = {
        "id": str(uuid.uuid4()),
        "certificate_number": generate_certificate_number(),
        "user_id": user_id,
        "course_id": course_id,
        "user_name": f"{user['first_name']} {user['last_name']}",
        "course_title": course["title"],
        "issued_at": now,
        "quiz_score": quiz_score,
        "completion_date": now,
        "pdf_url": None,
    }

    await db.certificates.insert_one(cert_doc)

    logger.info(
        f"Certificate issued: {cert_doc['certificate_number']} for user {user_id}"
    )
    return cert_doc
