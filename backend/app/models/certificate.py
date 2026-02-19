from typing import Optional

from pydantic import BaseModel, ConfigDict


class Certificate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    certificate_number: str  # Unique human-readable ID
    user_id: str
    course_id: str
    user_name: str
    course_title: str
    issued_at: str
    quiz_score: float
    completion_date: str
    pdf_url: Optional[str] = None
