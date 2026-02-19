from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class ModuleProgress(BaseModel):
    module_id: str
    completed: bool = False
    completed_at: Optional[str] = None
    time_spent_minutes: int = 0


class QuizAttempt(BaseModel):
    attempt_number: int
    score: float
    answers: Dict[str, int] = {}  # question_id: selected_answer
    submitted_at: str
    passed: bool


class QuizProgress(BaseModel):
    quiz_id: str  # course_id for course quiz
    attempts: List[QuizAttempt] = []
    best_score: float = 0
    passed: bool = False


class CourseProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    course_id: str
    modules_progress: List[ModuleProgress] = []
    quiz_progress: Optional[QuizProgress] = None
    overall_progress: float = 0  # percentage
    started_at: str
    last_accessed: str
    completed: bool = False
    completed_at: Optional[str] = None


class SubmitQuizRequest(BaseModel):
    course_id: str
    answers: Dict[str, int]  # question_id: selected_answer_index


class MarkModuleCompleteRequest(BaseModel):
    course_id: str
    module_id: str
    time_spent_minutes: int = 0
