from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class LearningPathStep(BaseModel):
    title: str
    type: str # course, lab, article, project
    duration: str
    description: str
    url: Optional[str] = None
    status: str = "pending" # pending, in_progress, completed

class LearningPath(BaseModel):
    id: str
    title: str
    description: str
    total_duration: str
    steps: List[LearningPathStep]
    user_id: Optional[str] = None
    created_at: str
    
    model_config = ConfigDict(from_attributes=True)

class GeneratePathRequest(BaseModel):
    skill_name: str
    current_level: str
    industry: str
    goal: str

class OpenSourcePath(BaseModel):
    title: str
    description: str
    steps: List[LearningPathStep]
    estimated_duration: str
    difficulty: str
