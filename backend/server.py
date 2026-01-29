from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'pluralskill-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI(title="PluralSkill API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

# Roles: admin, trainer, learner
VALID_ROLES = ["admin", "trainer", "learner"]

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    first_name: str
    last_name: str
    bio: Optional[str] = ""
    skills: List[str] = []
    role: str = "learner"
    enrolled_courses: List[str] = []
    created_at: str

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None

class UserRoleUpdate(BaseModel):
    role: str

# Workshop Models
class WorkshopSpeaker(BaseModel):
    name: str
    title: str
    company: str
    company_logo: Optional[str] = ""
    avatar_url: Optional[str] = ""
    linkedin: Optional[str] = ""

class WorkshopCreate(BaseModel):
    title: str
    description: str
    speakers: List[WorkshopSpeaker] = []
    date: str
    duration_minutes: int = 60
    max_participants: int = 100
    platform: str = "Instagram Live"
    platform_link: Optional[str] = ""
    tags: List[str] = []
    is_active: bool = True

class Workshop(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    speakers: List[WorkshopSpeaker]
    date: str
    duration_minutes: int
    max_participants: int
    platform: str
    platform_link: str
    tags: List[str]
    registered_count: int = 0
    is_active: bool
    created_at: str

# Course Models with Videos and Tests
class CourseModule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    duration_minutes: int = 30
    video_url: Optional[str] = ""
    order: int = 0

class CourseTest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int
    explanation: Optional[str] = ""

class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str
    short_description: str
    thumbnail_url: str
    category: str
    industry: str = ""
    level: str = "beginner"
    duration_hours: int = 10
    price: float = 0
    modules: List[CourseModule] = []
    tests: List[CourseTest] = []
    learning_outcomes: List[str] = []
    is_published: bool = False

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    industry: Optional[str] = None
    level: Optional[str] = None
    duration_hours: Optional[int] = None
    price: Optional[float] = None
    modules: Optional[List[CourseModule]] = None
    tests: Optional[List[CourseTest]] = None
    learning_outcomes: Optional[List[str]] = None
    is_published: Optional[bool] = None

class Course(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    slug: str
    description: str
    short_description: str
    thumbnail_url: str
    category: str
    industry: str
    level: str
    duration_hours: int
    price: float
    modules: List[CourseModule]
    tests: List[CourseTest]
    learning_outcomes: List[str]
    is_published: bool
    enrolled_count: int = 0
    created_at: str
    updated_at: str
    created_by: Optional[str] = None

# Open Source Learning Path Models
class OpenSourceResource(BaseModel):
    title: str
    url: str
    type: str
    duration: Optional[str] = ""
    description: str

class LearningPathStep(BaseModel):
    week: int
    title: str
    description: str
    resources: List[OpenSourceResource]
    skills_covered: List[str]

class OpenSourcePath(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    skill_name: str
    industry: str
    description: str
    difficulty: str
    estimated_weeks: int
    steps: List[LearningPathStep]
    created_at: str
    generated_by: str = "ai"

class GeneratePathRequest(BaseModel):
    skill_name: str
    industry: str
    current_level: str = "beginner"

# Lab Models
class LabStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    instructions: str
    expected_outcome: str
    hints: List[str] = []
    order: int = 0

class LabCreate(BaseModel):
    title: str
    slug: str
    description: str
    short_description: str
    thumbnail_url: str
    category: str
    technology: str
    difficulty: str = "beginner"
    estimated_time_minutes: int = 60
    steps: List[LabStep] = []
    prerequisites: List[str] = []
    skills_gained: List[str] = []
    is_published: bool = False

class Lab(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    slug: str
    description: str
    short_description: str
    thumbnail_url: str
    category: str
    technology: str
    difficulty: str
    estimated_time_minutes: int
    steps: List[LabStep]
    prerequisites: List[str]
    skills_gained: List[str]
    is_published: bool
    completions_count: int = 0
    created_at: str
    created_by: Optional[str] = None

# Access Tracking Model
class AccessLog(BaseModel):
    user_id: str
    content_type: str  # course, lab, workshop, open_source
    content_id: str
    action: str  # view, enroll, complete, start
    timestamp: str

class EnrollRequest(BaseModel):
    course_id: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        return user
    except:
        return None

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_trainer_or_admin(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["admin", "trainer"]:
        raise HTTPException(status_code=403, detail="Trainer or Admin access required")
    return user

async def log_access(user_id: str, content_type: str, content_id: str, action: str):
    """Log user access for analytics"""
    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "content_type": content_type,
        "content_id": content_id,
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.access_logs.insert_one(log_doc)

# ============== AUTH ROUTES ==============

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "bio": "",
        "skills": [],
        "role": "learner",  # Default role
        "enrolled_courses": [],
        "completed_labs": [],
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id, "learner")
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": "learner"
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["role"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "bio": user.get("bio", ""),
        "skills": user.get("skills", []),
        "role": user["role"],
        "enrolled_courses": user.get("enrolled_courses", []),
        "completed_labs": user.get("completed_labs", [])
    }

@api_router.put("/auth/password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    full_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    
    if not verify_password(data.current_password, full_user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(data.new_password), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Password updated successfully"}

# ============== USER PROFILE ROUTES ==============

@api_router.get("/users/profile", response_model=UserProfile)
async def get_profile(user: dict = Depends(get_current_user)):
    return UserProfile(
        id=user["id"],
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        bio=user.get("bio", ""),
        skills=user.get("skills", []),
        role=user["role"],
        enrolled_courses=user.get("enrolled_courses", []),
        created_at=user["created_at"]
    )

@api_router.put("/users/profile")
async def update_profile(profile_data: UserProfileUpdate, user: dict = Depends(get_current_user)):
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if profile_data.first_name is not None:
        update_doc["first_name"] = profile_data.first_name
    if profile_data.last_name is not None:
        update_doc["last_name"] = profile_data.last_name
    if profile_data.bio is not None:
        update_doc["bio"] = profile_data.bio
    if profile_data.skills is not None:
        update_doc["skills"] = profile_data.skills
    
    await db.users.update_one({"id": user["id"]}, {"$set": update_doc})
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

# ============== WORKSHOP ROUTES ==============

@api_router.get("/workshops")
async def get_workshops(active_only: bool = True, user: dict = Depends(get_optional_user)):
    query = {"is_active": True} if active_only else {}
    workshops = await db.workshops.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    
    # Log access
    if user:
        await log_access(user["id"], "workshop", "list", "view")
    
    return workshops

@api_router.get("/workshops/{workshop_id}")
async def get_workshop(workshop_id: str, user: dict = Depends(get_optional_user)):
    workshop = await db.workshops.find_one({"id": workshop_id}, {"_id": 0})
    if not workshop:
        raise HTTPException(status_code=404, detail="Workshop not found")
    
    if user:
        await log_access(user["id"], "workshop", workshop_id, "view")
    
    return workshop

@api_router.post("/trainer/workshops")
async def trainer_create_workshop(workshop_data: WorkshopCreate, user: dict = Depends(require_trainer_or_admin)):
    workshop_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    workshop_doc = {
        "id": workshop_id,
        **workshop_data.model_dump(),
        "registered_count": 0,
        "created_at": now,
        "created_by": user["id"]
    }
    
    await db.workshops.insert_one(workshop_doc)
    if "_id" in workshop_doc:
        del workshop_doc["_id"]
    return workshop_doc

@api_router.put("/trainer/workshops/{workshop_id}")
async def trainer_update_workshop(workshop_id: str, workshop_data: WorkshopCreate, user: dict = Depends(require_trainer_or_admin)):
    existing = await db.workshops.find_one({"id": workshop_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Workshop not found")
    
    # Trainers can only edit their own workshops, admins can edit any
    if user["role"] == "trainer" and existing.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own workshops")
    
    update_doc = workshop_data.model_dump()
    await db.workshops.update_one({"id": workshop_id}, {"$set": update_doc})
    
    updated = await db.workshops.find_one({"id": workshop_id}, {"_id": 0})
    return updated

@api_router.delete("/trainer/workshops/{workshop_id}")
async def trainer_delete_workshop(workshop_id: str, user: dict = Depends(require_trainer_or_admin)):
    existing = await db.workshops.find_one({"id": workshop_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Workshop not found")
    
    if user["role"] == "trainer" and existing.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own workshops")
    
    await db.workshops.delete_one({"id": workshop_id})
    return {"message": "Workshop deleted successfully"}

# ============== COURSE ROUTES ==============

@api_router.get("/courses")
async def get_courses(published_only: bool = True, user: dict = Depends(get_optional_user)):
    query = {"is_published": True} if published_only else {}
    courses = await db.courses.find(query, {"_id": 0}).to_list(100)
    
    if user:
        await log_access(user["id"], "course", "list", "view")
    
    return courses

@api_router.get("/courses/{slug}")
async def get_course_by_slug(slug: str, user: dict = Depends(get_optional_user)):
    course = await db.courses.find_one({"slug": slug}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    is_enrolled = False
    if user:
        if course["id"] in user.get("enrolled_courses", []):
            is_enrolled = True
        await log_access(user["id"], "course", course["id"], "view")
    
    return {**course, "is_enrolled": is_enrolled}

@api_router.post("/courses/enroll")
async def enroll_in_course(data: EnrollRequest, user: dict = Depends(get_current_user)):
    course = await db.courses.find_one({"id": data.course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if data.course_id in user.get("enrolled_courses", []):
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$push": {"enrolled_courses": data.course_id}}
    )
    
    await db.courses.update_one(
        {"id": data.course_id},
        {"$inc": {"enrolled_count": 1}}
    )
    
    await log_access(user["id"], "course", data.course_id, "enroll")
    
    return {"message": "Successfully enrolled in course", "course_id": data.course_id}

@api_router.get("/my-courses")
async def get_my_courses(user: dict = Depends(get_current_user)):
    enrolled_ids = user.get("enrolled_courses", [])
    if not enrolled_ids:
        return []
    
    courses = await db.courses.find({"id": {"$in": enrolled_ids}}, {"_id": 0}).to_list(100)
    return courses

# Trainer Course Management
@api_router.get("/trainer/courses")
async def get_trainer_courses(user: dict = Depends(require_trainer_or_admin)):
    """Get courses - trainers see their own, admins see all"""
    if user["role"] == "admin":
        courses = await db.courses.find({}, {"_id": 0}).to_list(100)
    else:
        courses = await db.courses.find({"created_by": user["id"]}, {"_id": 0}).to_list(100)
    return courses

@api_router.post("/trainer/courses")
async def trainer_create_course(course_data: CourseCreate, user: dict = Depends(require_trainer_or_admin)):
    existing = await db.courses.find_one({"slug": course_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Course with this slug already exists")
    
    course_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    course_doc = {
        "id": course_id,
        **course_data.model_dump(),
        "enrolled_count": 0,
        "created_at": now,
        "updated_at": now,
        "created_by": user["id"]
    }
    
    await db.courses.insert_one(course_doc)
    if "_id" in course_doc:
        del course_doc["_id"]
    return course_doc

@api_router.put("/trainer/courses/{course_id}")
async def trainer_update_course(course_id: str, course_data: CourseUpdate, user: dict = Depends(require_trainer_or_admin)):
    existing = await db.courses.find_one({"id": course_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if user["role"] == "trainer" and existing.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own courses")
    
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    for field, value in course_data.model_dump(exclude_unset=True).items():
        if value is not None:
            update_doc[field] = value
    
    await db.courses.update_one({"id": course_id}, {"$set": update_doc})
    updated = await db.courses.find_one({"id": course_id}, {"_id": 0})
    return updated

@api_router.delete("/trainer/courses/{course_id}")
async def trainer_delete_course(course_id: str, user: dict = Depends(require_trainer_or_admin)):
    existing = await db.courses.find_one({"id": course_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if user["role"] == "trainer" and existing.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own courses")
    
    await db.courses.delete_one({"id": course_id})
    return {"message": "Course deleted successfully"}

# ============== OPEN SOURCE LEARNING PATHS ==============

@api_router.get("/open-source/paths")
async def get_learning_paths(user: dict = Depends(get_optional_user)):
    paths = await db.learning_paths.find({}, {"_id": 0}).to_list(100)
    
    if user:
        await log_access(user["id"], "open_source", "list", "view")
    
    return paths

@api_router.get("/open-source/paths/{path_id}")
async def get_learning_path(path_id: str, user: dict = Depends(get_optional_user)):
    path = await db.learning_paths.find_one({"id": path_id}, {"_id": 0})
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    if user:
        await log_access(user["id"], "open_source", path_id, "view")
    
    return path

@api_router.post("/open-source/generate")
async def generate_learning_path(request: GeneratePathRequest, user: dict = Depends(get_optional_user)):
    """Generate an AI-powered learning path for a specific skill"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"path-gen-{uuid.uuid4()}",
        system_message="""You are an expert learning path curator. Generate comprehensive learning roadmaps using FREE open-source resources.
        
Your response must be valid JSON with this exact structure:
{
    "description": "Brief overview of the learning path",
    "estimated_weeks": number,
    "steps": [
        {
            "week": number,
            "title": "Week title",
            "description": "What you'll learn",
            "resources": [
                {
                    "title": "Resource name",
                    "url": "https://actual-url.com",
                    "type": "video|article|documentation|github|tutorial",
                    "duration": "2 hours",
                    "description": "What this resource covers"
                }
            ],
            "skills_covered": ["skill1", "skill2"]
        }
    ]
}

Use REAL URLs from YouTube, freeCodeCamp, Official docs, GitHub, Medium/Dev.to."""
    ).with_model("openai", "gpt-5.2")
    
    prompt = f"""Create a detailed learning path for: {request.skill_name}
Industry context: {request.industry}
Current level: {request.current_level}

Generate a 4-8 week roadmap with specific, real open-source resources."""
    
    user_message = UserMessage(text=prompt)
    
    try:
        response = await chat.send_message(user_message)
        
        try:
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response[7:]
            if clean_response.startswith("```"):
                clean_response = clean_response[3:]
            if clean_response.endswith("```"):
                clean_response = clean_response[:-3]
            
            path_data = json.loads(clean_response.strip())
        except json.JSONDecodeError:
            path_data = {
                "description": f"Learning path for {request.skill_name} in {request.industry}",
                "estimated_weeks": 6,
                "steps": []
            }
        
        path_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        path_doc = {
            "id": path_id,
            "skill_name": request.skill_name,
            "industry": request.industry,
            "difficulty": request.current_level,
            "description": path_data.get("description", ""),
            "estimated_weeks": path_data.get("estimated_weeks", 6),
            "steps": path_data.get("steps", []),
            "created_at": now,
            "generated_by": "ai",
            "user_id": user["id"] if user else None
        }
        
        await db.learning_paths.insert_one(path_doc)
        if "_id" in path_doc:
            del path_doc["_id"]
        
        if user:
            await log_access(user["id"], "open_source", path_id, "generate")
        
        return path_doc
        
    except Exception as e:
        logger.error(f"Failed to generate learning path: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate learning path: {str(e)}")

# ============== LABS ROUTES ==============

@api_router.get("/labs")
async def get_labs(published_only: bool = True, user: dict = Depends(get_optional_user)):
    query = {"is_published": True} if published_only else {}
    labs = await db.labs.find(query, {"_id": 0}).to_list(100)
    
    if user:
        await log_access(user["id"], "lab", "list", "view")
    
    return labs

@api_router.get("/labs/{slug}")
async def get_lab_by_slug(slug: str, user: dict = Depends(get_optional_user)):
    lab = await db.labs.find_one({"slug": slug}, {"_id": 0})
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    is_completed = False
    if user:
        if lab["id"] in user.get("completed_labs", []):
            is_completed = True
        await log_access(user["id"], "lab", lab["id"], "view")
    
    return {**lab, "is_completed": is_completed}

@api_router.post("/labs/{lab_id}/start")
async def start_lab(lab_id: str, user: dict = Depends(get_current_user)):
    lab = await db.labs.find_one({"id": lab_id}, {"_id": 0})
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    await log_access(user["id"], "lab", lab_id, "start")
    return {"message": "Lab started", "lab_id": lab_id}

@api_router.post("/labs/{lab_id}/complete")
async def complete_lab(lab_id: str, user: dict = Depends(get_current_user)):
    lab = await db.labs.find_one({"id": lab_id}, {"_id": 0})
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    if lab_id not in user.get("completed_labs", []):
        await db.users.update_one(
            {"id": user["id"]},
            {"$push": {"completed_labs": lab_id}}
        )
        await db.labs.update_one(
            {"id": lab_id},
            {"$inc": {"completions_count": 1}}
        )
    
    await log_access(user["id"], "lab", lab_id, "complete")
    return {"message": "Lab marked as completed", "lab_id": lab_id}

# Trainer Lab Management
@api_router.get("/trainer/labs")
async def get_trainer_labs(user: dict = Depends(require_trainer_or_admin)):
    if user["role"] == "admin":
        labs = await db.labs.find({}, {"_id": 0}).to_list(100)
    else:
        labs = await db.labs.find({"created_by": user["id"]}, {"_id": 0}).to_list(100)
    return labs

@api_router.post("/trainer/labs")
async def trainer_create_lab(lab_data: LabCreate, user: dict = Depends(require_trainer_or_admin)):
    existing = await db.labs.find_one({"slug": lab_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Lab with this slug already exists")
    
    lab_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    lab_doc = {
        "id": lab_id,
        **lab_data.model_dump(),
        "completions_count": 0,
        "created_at": now,
        "created_by": user["id"]
    }
    
    await db.labs.insert_one(lab_doc)
    if "_id" in lab_doc:
        del lab_doc["_id"]
    return lab_doc

@api_router.put("/trainer/labs/{lab_id}")
async def trainer_update_lab(lab_id: str, lab_data: LabCreate, user: dict = Depends(require_trainer_or_admin)):
    existing = await db.labs.find_one({"id": lab_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    if user["role"] == "trainer" and existing.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own labs")
    
    update_doc = lab_data.model_dump()
    await db.labs.update_one({"id": lab_id}, {"$set": update_doc})
    
    updated = await db.labs.find_one({"id": lab_id}, {"_id": 0})
    return updated

@api_router.delete("/trainer/labs/{lab_id}")
async def trainer_delete_lab(lab_id: str, user: dict = Depends(require_trainer_or_admin)):
    existing = await db.labs.find_one({"id": lab_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    if user["role"] == "trainer" and existing.get("created_by") != user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own labs")
    
    await db.labs.delete_one({"id": lab_id})
    return {"message": "Lab deleted successfully"}

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_learners = await db.users.count_documents({"role": "learner"})
    total_trainers = await db.users.count_documents({"role": "trainer"})
    total_courses = await db.courses.count_documents({})
    total_workshops = await db.workshops.count_documents({})
    total_labs = await db.labs.count_documents({})
    total_paths = await db.learning_paths.count_documents({})
    published_courses = await db.courses.count_documents({"is_published": True})
    published_labs = await db.labs.count_documents({"is_published": True})
    active_workshops = await db.workshops.count_documents({"is_active": True})
    
    # Get total enrollments
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$enrolled_count"}}}
    ]
    enrollment_result = await db.courses.aggregate(pipeline).to_list(1)
    total_enrollments = enrollment_result[0]["total"] if enrollment_result else 0
    
    # Get total lab completions
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$completions_count"}}}
    ]
    completion_result = await db.labs.aggregate(pipeline).to_list(1)
    total_completions = completion_result[0]["total"] if completion_result else 0
    
    return {
        "total_users": total_users,
        "total_learners": total_learners,
        "total_trainers": total_trainers,
        "total_courses": total_courses,
        "published_courses": published_courses,
        "total_workshops": total_workshops,
        "active_workshops": active_workshops,
        "total_labs": total_labs,
        "published_labs": published_labs,
        "total_learning_paths": total_paths,
        "total_enrollments": total_enrollments,
        "total_lab_completions": total_completions
    }

@api_router.get("/admin/analytics")
async def get_admin_analytics(admin: dict = Depends(require_admin)):
    """Get detailed analytics data for admin dashboard"""
    now = datetime.now(timezone.utc)
    
    # Access logs by content type (last 30 days)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    pipeline = [
        {"$match": {"timestamp": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"content_type": "$content_type", "action": "$action"},
            "count": {"$sum": 1}
        }}
    ]
    access_stats = await db.access_logs.aggregate(pipeline).to_list(100)
    
    # Users by role
    role_pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]
    users_by_role = await db.users.aggregate(role_pipeline).to_list(10)
    
    # Top courses by enrollment
    top_courses = await db.courses.find(
        {"is_published": True}, 
        {"_id": 0, "title": 1, "enrolled_count": 1, "category": 1}
    ).sort("enrolled_count", -1).limit(5).to_list(5)
    
    # Top labs by completions
    top_labs = await db.labs.find(
        {"is_published": True},
        {"_id": 0, "title": 1, "completions_count": 1, "technology": 1}
    ).sort("completions_count", -1).limit(5).to_list(5)
    
    # Courses by category
    category_pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    courses_by_category = await db.courses.aggregate(category_pipeline).to_list(20)
    
    # Recent signups (last 7 days)
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    recent_signups = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
    
    return {
        "access_stats": access_stats,
        "users_by_role": users_by_role,
        "top_courses": top_courses,
        "top_labs": top_labs,
        "courses_by_category": courses_by_category,
        "recent_signups": recent_signups
    }

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role_data: UserRoleUpdate, admin: dict = Depends(require_admin)):
    """Update a user's role (admin only)"""
    if role_data.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {VALID_ROLES}")
    
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": role_data.role, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return updated_user

@api_router.get("/admin/courses")
async def get_all_courses(admin: dict = Depends(require_admin)):
    courses = await db.courses.find({}, {"_id": 0}).to_list(100)
    return courses

@api_router.post("/admin/courses")
async def admin_create_course(course_data: CourseCreate, admin: dict = Depends(require_admin)):
    existing = await db.courses.find_one({"slug": course_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Course with this slug already exists")
    
    course_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    course_doc = {
        "id": course_id,
        **course_data.model_dump(),
        "enrolled_count": 0,
        "created_at": now,
        "updated_at": now,
        "created_by": admin["id"]
    }
    
    await db.courses.insert_one(course_doc)
    if "_id" in course_doc:
        del course_doc["_id"]
    return course_doc

@api_router.put("/admin/courses/{course_id}")
async def admin_update_course(course_id: str, course_data: CourseUpdate, admin: dict = Depends(require_admin)):
    existing = await db.courses.find_one({"id": course_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Course not found")
    
    update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    for field, value in course_data.model_dump(exclude_unset=True).items():
        if value is not None:
            update_doc[field] = value
    
    await db.courses.update_one({"id": course_id}, {"$set": update_doc})
    updated = await db.courses.find_one({"id": course_id}, {"_id": 0})
    return updated

@api_router.delete("/admin/courses/{course_id}")
async def admin_delete_course(course_id: str, admin: dict = Depends(require_admin)):
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}

@api_router.get("/admin/workshops")
async def get_all_workshops(admin: dict = Depends(require_admin)):
    workshops = await db.workshops.find({}, {"_id": 0}).to_list(100)
    return workshops

@api_router.post("/admin/workshops")
async def admin_create_workshop(workshop_data: WorkshopCreate, admin: dict = Depends(require_admin)):
    workshop_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    workshop_doc = {
        "id": workshop_id,
        **workshop_data.model_dump(),
        "registered_count": 0,
        "created_at": now,
        "created_by": admin["id"]
    }
    
    await db.workshops.insert_one(workshop_doc)
    if "_id" in workshop_doc:
        del workshop_doc["_id"]
    return workshop_doc

@api_router.delete("/admin/workshops/{workshop_id}")
async def admin_delete_workshop(workshop_id: str, admin: dict = Depends(require_admin)):
    result = await db.workshops.delete_one({"id": workshop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return {"message": "Workshop deleted successfully"}

@api_router.get("/admin/labs")
async def get_all_labs(admin: dict = Depends(require_admin)):
    labs = await db.labs.find({}, {"_id": 0}).to_list(100)
    return labs

@api_router.post("/admin/labs")
async def admin_create_lab(lab_data: LabCreate, admin: dict = Depends(require_admin)):
    existing = await db.labs.find_one({"slug": lab_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Lab with this slug already exists")
    
    lab_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    lab_doc = {
        "id": lab_id,
        **lab_data.model_dump(),
        "completions_count": 0,
        "created_at": now,
        "created_by": admin["id"]
    }
    
    await db.labs.insert_one(lab_doc)
    if "_id" in lab_doc:
        del lab_doc["_id"]
    return lab_doc

@api_router.delete("/admin/labs/{lab_id}")
async def admin_delete_lab(lab_id: str, admin: dict = Depends(require_admin)):
    result = await db.labs.delete_one({"id": lab_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lab not found")
    return {"message": "Lab deleted successfully"}

@api_router.delete("/admin/open-source/paths/{path_id}")
async def admin_delete_learning_path(path_id: str, admin: dict = Depends(require_admin)):
    result = await db.learning_paths.delete_one({"id": path_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return {"message": "Learning path deleted"}

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "PluralSkill API is running", "version": "2.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Seed initial data on startup
@app.on_event("startup")
async def seed_data():
    now = datetime.now(timezone.utc).isoformat()
    
    # Seed Workshops with Industry Leaders
    workshop_count = await db.workshops.count_documents({})
    if workshop_count == 0:
        logger.info("Seeding workshops...")
        workshops = [
            {
                "id": str(uuid.uuid4()),
                "title": "AI in Finance: Transforming FP&A with Machine Learning",
                "description": "Learn how leading financial institutions are leveraging AI for forecasting, risk assessment, and automated reporting. Real case studies from top banks and fintech companies.",
                "speakers": [
                    {"name": "Sarah Chen", "title": "VP of Data Science", "company": "Goldman Sachs", "company_logo": "https://logo.clearbit.com/goldmansachs.com", "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200", "linkedin": ""},
                    {"name": "Michael Torres", "title": "Head of AI Products", "company": "Stripe", "company_logo": "https://logo.clearbit.com/stripe.com", "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200", "linkedin": ""}
                ],
                "date": "2026-02-15T18:00:00Z",
                "duration_minutes": 90,
                "max_participants": 500,
                "platform": "Instagram Live",
                "platform_link": "https://instagram.com/pluralskill",
                "tags": ["Finance", "AI", "Machine Learning", "FP&A"],
                "registered_count": 342,
                "is_active": True,
                "created_at": now
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Building Data-Driven HR: From Analytics to Action",
                "description": "Industry leaders from Microsoft and Workday share how they use people analytics to drive retention, engagement, and strategic workforce planning.",
                "speakers": [{"name": "Jennifer Williams", "title": "Chief People Analytics Officer", "company": "Microsoft", "company_logo": "https://logo.clearbit.com/microsoft.com", "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200", "linkedin": ""}],
                "date": "2026-02-22T17:00:00Z",
                "duration_minutes": 60,
                "max_participants": 300,
                "platform": "Instagram Live",
                "platform_link": "https://instagram.com/pluralskill",
                "tags": ["HR", "People Analytics", "Data Science"],
                "registered_count": 189,
                "is_active": True,
                "created_at": now
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Supply Chain Resilience: Lessons from Industry Leaders",
                "description": "Executives from Amazon and Toyota discuss how they built resilient supply chains using data analytics, AI, and real-time visibility tools.",
                "speakers": [
                    {"name": "David Kim", "title": "Director of Supply Chain Analytics", "company": "Amazon", "company_logo": "https://logo.clearbit.com/amazon.com", "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200", "linkedin": ""},
                    {"name": "Yuki Tanaka", "title": "VP of Operations Excellence", "company": "Toyota", "company_logo": "https://logo.clearbit.com/toyota.com", "avatar_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200", "linkedin": ""}
                ],
                "date": "2026-03-01T16:00:00Z",
                "duration_minutes": 75,
                "max_participants": 400,
                "platform": "Instagram Live",
                "platform_link": "https://instagram.com/pluralskill",
                "tags": ["Supply Chain", "Operations", "Analytics"],
                "registered_count": 267,
                "is_active": True,
                "created_at": now
            }
        ]
        await db.workshops.insert_many(workshops)
        logger.info(f"Seeded {len(workshops)} workshops")
    
    # Seed Industry-focused Courses
    course_count = await db.courses.count_documents({})
    if course_count == 0:
        logger.info("Seeding courses...")
        courses = [
            {"id": str(uuid.uuid4()), "title": "Finance & FP&A Essentials (Excel + Power BI)", "slug": "finance-fpa-essentials", "description": "Master financial planning and analysis with hands-on Excel modeling and Power BI dashboards.", "short_description": "Model P&L statements, forecast cash flow, and analyze budget variance.", "thumbnail_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800", "category": "Finance", "industry": "Financial Services", "level": "intermediate", "duration_hours": 25, "price": 0, "modules": [{"id": str(uuid.uuid4()), "title": "Financial Modeling Fundamentals", "description": "Build your first P&L model", "duration_minutes": 90, "video_url": "", "order": 1}], "tests": [], "learning_outcomes": ["Build financial models", "Create dashboards"], "is_published": True, "enrolled_count": 1250, "created_at": now, "updated_at": now},
            {"id": str(uuid.uuid4()), "title": "HR Analytics Using Excel & Power BI", "slug": "hr-analytics-excel-powerbi", "description": "Transform HR data into actionable insights.", "short_description": "Attrition prediction, performance indicators, diversity metrics.", "thumbnail_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "category": "Human Resources", "industry": "HR & People Operations", "level": "beginner", "duration_hours": 20, "price": 0, "modules": [], "tests": [], "learning_outcomes": ["Analyze attrition", "Build HR dashboards"], "is_published": True, "enrolled_count": 890, "created_at": now, "updated_at": now},
            {"id": str(uuid.uuid4()), "title": "Retail Analytics Using Excel & Power BI", "slug": "retail-analytics", "description": "Learn retail analytics from industry practitioners.", "short_description": "Sales trends, store profitability, inventory turnover.", "thumbnail_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800", "category": "Retail", "industry": "Retail & E-commerce", "level": "intermediate", "duration_hours": 22, "price": 0, "modules": [], "tests": [], "learning_outcomes": ["Analyze retail data"], "is_published": True, "enrolled_count": 675, "created_at": now, "updated_at": now},
            {"id": str(uuid.uuid4()), "title": "Excel for Operations & Supply Chain", "slug": "excel-operations-supply-chain", "description": "Build practical Excel models for supply chain management.", "short_description": "Demand planning, inventory analysis, supplier performance.", "thumbnail_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800", "category": "Operations", "industry": "Supply Chain & Logistics", "level": "intermediate", "duration_hours": 28, "price": 0, "modules": [], "tests": [], "learning_outcomes": ["Forecast demand", "Optimize inventory"], "is_published": True, "enrolled_count": 520, "created_at": now, "updated_at": now},
            {"id": str(uuid.uuid4()), "title": "AI Tools for Daily Productivity", "slug": "ai-productivity-tools", "description": "Leverage AI for everyday work tasks.", "short_description": "AI for writing, presentations, automating tasks.", "thumbnail_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800", "category": "Technology", "industry": "Cross-Industry", "level": "beginner", "duration_hours": 8, "price": 0, "modules": [], "tests": [], "learning_outcomes": ["Use AI tools effectively"], "is_published": True, "enrolled_count": 2100, "created_at": now, "updated_at": now},
            {"id": str(uuid.uuid4()), "title": "Power BI in Practice", "slug": "power-bi-in-practice", "description": "Comprehensive Power BI course from basics to advanced.", "short_description": "Data modeling, DAX formulas, interactive dashboards.", "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800", "category": "Business Intelligence", "industry": "Cross-Industry", "level": "beginner", "duration_hours": 35, "price": 0, "modules": [], "tests": [], "learning_outcomes": ["Master Power BI"], "is_published": True, "enrolled_count": 1850, "created_at": now, "updated_at": now}
        ]
        await db.courses.insert_many(courses)
        logger.info(f"Seeded {len(courses)} courses")
    
    # Seed Labs
    lab_count = await db.labs.count_documents({})
    if lab_count == 0:
        logger.info("Seeding labs...")
        labs = [
            {"id": str(uuid.uuid4()), "title": "Python Data Pipeline: From CSV to Dashboard", "slug": "python-data-pipeline", "description": "Build a complete data pipeline in Python.", "short_description": "End-to-end data pipeline with Python, Pandas, SQLite.", "thumbnail_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800", "category": "Data Engineering", "technology": "Python", "difficulty": "intermediate", "estimated_time_minutes": 120, "steps": [{"id": str(uuid.uuid4()), "title": "Environment Setup", "description": "Set up Python environment", "instructions": "Install packages", "expected_outcome": "Working environment", "hints": ["pip install pandas"], "order": 1}], "prerequisites": ["Basic Python"], "skills_gained": ["Pandas", "SQLite"], "is_published": True, "completions_count": 450, "created_at": now},
            {"id": str(uuid.uuid4()), "title": "Machine Learning Model Deployment", "slug": "ml-model-deployment", "description": "Deploy ML model to production.", "short_description": "Flask, Docker, cloud deployment.", "thumbnail_url": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800", "category": "Machine Learning", "technology": "Python, Docker, Flask", "difficulty": "advanced", "estimated_time_minutes": 180, "steps": [], "prerequisites": ["Python intermediate", "Docker basics"], "skills_gained": ["Model deployment", "Docker"], "is_published": True, "completions_count": 280, "created_at": now},
            {"id": str(uuid.uuid4()), "title": "Financial Dashboard with Excel VBA", "slug": "financial-dashboard-vba", "description": "Automated financial reporting dashboard.", "short_description": "Excel VBA macros and dynamic dashboards.", "thumbnail_url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800", "category": "Finance", "technology": "Excel, VBA", "difficulty": "intermediate", "estimated_time_minutes": 150, "steps": [], "prerequisites": ["Excel intermediate"], "skills_gained": ["VBA programming"], "is_published": True, "completions_count": 620, "created_at": now},
            {"id": str(uuid.uuid4()), "title": "Power BI Sales Analytics Solution", "slug": "powerbi-sales-analytics", "description": "Enterprise-grade sales analytics.", "short_description": "Data modeling, DAX, interactive dashboards.", "thumbnail_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", "category": "Business Intelligence", "technology": "Power BI, DAX", "difficulty": "intermediate", "estimated_time_minutes": 180, "steps": [], "prerequisites": ["Power BI basics"], "skills_gained": ["Power BI modeling", "DAX"], "is_published": True, "completions_count": 780, "created_at": now}
        ]
        await db.labs.insert_many(labs)
        logger.info(f"Seeded {len(labs)} labs")
    
    # Create admin user if not exists
    admin_exists = await db.users.find_one({"email": "admin@pluralskill.com"})
    if not admin_exists:
        logger.info("Creating admin user...")
        admin_doc = {"id": str(uuid.uuid4()), "email": "admin@pluralskill.com", "password_hash": hash_password("admin123"), "first_name": "Admin", "last_name": "User", "bio": "Platform Administrator", "skills": [], "role": "admin", "enrolled_courses": [], "completed_labs": [], "created_at": now, "updated_at": now}
        await db.users.insert_one(admin_doc)
        logger.info("Admin user created")
    
    # Create trainer user if not exists
    trainer_exists = await db.users.find_one({"email": "trainer@pluralskill.com"})
    if not trainer_exists:
        logger.info("Creating trainer user...")
        trainer_doc = {"id": str(uuid.uuid4()), "email": "trainer@pluralskill.com", "password_hash": hash_password("trainer123"), "first_name": "Sarah", "last_name": "Trainer", "bio": "Course Instructor", "skills": ["Excel", "Power BI", "Python"], "role": "trainer", "enrolled_courses": [], "completed_labs": [], "created_at": now, "updated_at": now}
        await db.users.insert_one(trainer_doc)
        logger.info("Trainer user created")
