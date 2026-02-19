from typing import Optional

from pydantic import BaseModel, ConfigDict


class AssignmentCreate(BaseModel):
    course_id: str
    module_id: Optional[str] = None
    title: str
    description: str
    instructions: str
    due_date: Optional[str] = None
    max_score: int = 100
    is_required: bool = True


class Assignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    course_id: str
    module_id: Optional[str]
    title: str
    description: str
    instructions: str
    due_date: Optional[str]
    max_score: int
    is_required: bool
    created_at: str
    created_by: str


class AssignmentSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    assignment_id: str
    user_id: str
    file_url: str
    file_name: str
    notes: str = ""
    submitted_at: str
    grade: Optional[float] = None
    feedback: Optional[str] = None
    graded_at: Optional[str] = None
    graded_by: Optional[str] = None


class SubmissionCreate(BaseModel):
    assignment_id: str
    notes: str = ""


class GradeSubmission(BaseModel):
    grade: float
    feedback: str = ""
