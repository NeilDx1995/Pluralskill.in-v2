from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict

# ─── Workshops ────────────────────────────────────────────────


class Workshop(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    title: str
    slug: Optional[str] = None
    description: str
    date: Optional[str] = None
    duration_minutes: Optional[int] = None
    platform: Optional[str] = None
    image_url: Optional[str] = None
    tags: List[str] = []
    max_participants: Optional[int] = None
    registered_count: int = 0
    is_active: bool = True
    created_at: Optional[str] = None


class WorkshopCreate(BaseModel):
    title: str
    slug: str
    description: str
    date: str
    duration_minutes: int = 60
    platform: str = "Virtual"
    image_url: Optional[str] = None
    tags: List[str] = []
    max_participants: int = 100


# ─── Courses ──────────────────────────────────────────────────


class Course(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    title: str
    slug: str
    description: str
    level: str
    category: str
    duration_hours: Optional[int] = None
    price: int = 0
    thumbnail_url: Optional[str] = None
    modules: List[dict] = []
    is_published: bool = True
    enrolled_count: int = 0
    created_at: str
    updated_at: str


class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str
    level: str
    category: str
    duration_hours: int = 0
    price: int = 0
    thumbnail_url: Optional[str] = None
    is_published: bool = False


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    category: Optional[str] = None
    duration_hours: Optional[int] = None
    price: Optional[int] = None
    thumbnail_url: Optional[str] = None
    modules: Optional[List[dict]] = None
    is_published: Optional[bool] = None


# ─── Labs ─────────────────────────────────────────────────────


class LabStep(BaseModel):
    title: str
    instruction: str
    code_snippet: Optional[str] = None
    hint: Optional[str] = None
    validation_type: str = "manual"
    validation_criteria: Optional[str] = None


class Lab(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    title: str
    slug: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    description: str
    steps: List[Any] = []
    video_url: Optional[str] = None
    created_at: Optional[str] = None


class LabCreate(BaseModel):
    title: str
    slug: str
    topic: str
    difficulty: str
    duration: str
    description: str
    steps: List[LabStep] = []
    video_url: Optional[str] = None
