import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.config import settings
from app.core.security import get_current_user, require_trainer_or_admin
from app.db.session import db
from app.models.assignment import (Assignment, AssignmentCreate,
                                   AssignmentSubmission, GradeSubmission,
                                   SubmissionCreate)
from app.services.analytics import log_access
from app.services.progress import check_and_issue_certificate

router = APIRouter()

# We need UPLOAD_DIR. Ideally from config or finding generic upload dir.
# For now, let's assume valid path relative to app root or defined in settings.
# server.py defined it as ROOT_DIR / "uploads".
# We should probably centralize this in config.
UPLOAD_DIR = Path("uploads")


@router.get("/courses/{course_id}/assignments")
async def get_course_assignments(
    course_id: str, user: dict = Depends(get_current_user)
):
    """Get all assignments for a course"""
    assignments = await db.assignments.find(
        {"course_id": course_id}, {"_id": 0}
    ).to_list(100)

    # Add submission status for current user
    for assignment in assignments:
        submission = await db.submissions.find_one(
            {"assignment_id": assignment["id"], "user_id": user["id"]}, {"_id": 0}
        )
        assignment["submission"] = submission

    return assignments


@router.post("/assignments")
async def create_assignment(
    data: AssignmentCreate, user: dict = Depends(require_trainer_or_admin)
):
    """Create a new assignment for a course"""
    course = await db.courses.find_one({"id": data.course_id})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Trainers can only add to their own courses
    if user["role"] == "trainer" and course.get("created_by") != user["id"]:
        raise HTTPException(
            status_code=403, detail="You can only add assignments to your own courses"
        )

    now = datetime.now(timezone.utc).isoformat()
    assignment_doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": now,
        "created_by": user["id"],
    }

    await db.assignments.insert_one(assignment_doc)
    if "_id" in assignment_doc:
        del assignment_doc["_id"]

    return assignment_doc


@router.delete("/assignments/{assignment_id}")
async def delete_assignment(
    assignment_id: str, user: dict = Depends(require_trainer_or_admin)
):
    """Delete an assignment"""
    assignment = await db.assignments.find_one({"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if user["role"] == "trainer" and assignment.get("created_by") != user["id"]:
        raise HTTPException(
            status_code=403, detail="You can only delete your own assignments"
        )

    await db.assignments.delete_one({"id": assignment_id})
    return {"message": "Assignment deleted"}


@router.post("/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: str,
    notes: str = Form(""),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Submit an assignment with file upload"""
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check if user is enrolled in the course
    if assignment["course_id"] not in user.get("enrolled_courses", []):
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Check for existing submission — allow resubmission
    existing = await db.submissions.find_one(
        {"assignment_id": assignment_id, "user_id": user["id"]}
    )

    # Save file
    # Ensure directory exists
    (UPLOAD_DIR / "assignments").mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / "assignments" / unique_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/assignments/{unique_name}"

    now = datetime.now(timezone.utc).isoformat()

    if existing:
        # Resubmission: update existing record, reset grade
        await db.submissions.update_one(
            {"id": existing["id"]},
            {
                "$set": {
                    "file_url": file_url,
                    "file_name": file.filename,
                    "notes": notes,
                    "submitted_at": now,
                    "grade": None,
                    "feedback": None,
                    "graded_at": None,
                    "graded_by": None,
                    "resubmitted": True,
                }
            },
        )
        updated = await db.submissions.find_one({"id": existing["id"]}, {"_id": 0})
        return updated
    else:
        # First submission
        submission_doc = {
            "id": str(uuid.uuid4()),
            "assignment_id": assignment_id,
            "user_id": user["id"],
            "file_url": file_url,
            "file_name": file.filename,
            "notes": notes,
            "submitted_at": now,
            "grade": None,
            "feedback": None,
            "graded_at": None,
            "graded_by": None,
        }

        await db.submissions.insert_one(submission_doc)
        if "_id" in submission_doc:
            del submission_doc["_id"]

        return submission_doc


@router.get("/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(
    assignment_id: str, user: dict = Depends(require_trainer_or_admin)
):
    """Get all submissions for an assignment (trainer/admin only)"""
    assignment = await db.assignments.find_one({"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if user["role"] == "trainer" and assignment.get("created_by") != user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only view submissions for your own assignments",
        )

    submissions = await db.submissions.find(
        {"assignment_id": assignment_id}, {"_id": 0}
    ).to_list(100)

    # Add user info to each submission
    for sub in submissions:
        sub_user = await db.users.find_one(
            {"id": sub["user_id"]}, {"_id": 0, "password_hash": 0}
        )
        if sub_user:
            sub["user_name"] = f"{sub_user['first_name']} {sub_user['last_name']}"
            sub["user_email"] = sub_user["email"]

    return submissions


@router.put("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: str,
    data: GradeSubmission,
    user: dict = Depends(require_trainer_or_admin),
):
    """Grade an assignment submission"""
    submission = await db.submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    assignment = await db.assignments.find_one({"id": submission["assignment_id"]})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if user["role"] == "trainer" and assignment.get("created_by") != user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You can only grade submissions for your own assignments",
        )

    if data.grade < 0 or data.grade > assignment.get("max_score", 100):
        raise HTTPException(
            status_code=400,
            detail=f"Grade must be between 0 and {assignment.get('max_score', 100)}",
        )

    now = datetime.now(timezone.utc).isoformat()
    await db.submissions.update_one(
        {"id": submission_id},
        {
            "$set": {
                "grade": data.grade,
                "feedback": data.feedback,
                "graded_at": now,
                "graded_by": user["id"],
            }
        },
    )

    # Check if student now qualifies for certificate
    student_id = submission["user_id"]
    course_id = assignment["course_id"]
    certificate = await check_and_issue_certificate(student_id, course_id)

    updated = await db.submissions.find_one({"id": submission_id}, {"_id": 0})
    updated["certificate_issued"] = certificate is not None

    return updated
