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

# Create the main app
app = FastAPI(title="PluralSkill API", version="1.0.0")

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
    role: str = "user"
    enrolled_courses: List[str] = []
    created_at: str

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None

class CourseModule(BaseModel):
    title: str
    description: str
    duration_minutes: int = 30

class CourseCreate(BaseModel):
    title: str
    slug: str
    description: str
    short_description: str
    thumbnail_url: str
    category: str
    level: str = "beginner"
    duration_hours: int = 10
    price: float = 0
    modules: List[CourseModule] = []
    is_published: bool = False

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    duration_hours: Optional[int] = None
    price: Optional[float] = None
    modules: Optional[List[CourseModule]] = None
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
    level: str
    duration_hours: int
    price: float
    modules: List[CourseModule]
    is_published: bool
    enrolled_count: int = 0
    created_at: str
    updated_at: str

class WorkshopCreate(BaseModel):
    title: str
    description: str
    instructor: str
    date: str
    duration_minutes: int = 60
    max_participants: int = 100
    is_active: bool = True

class Workshop(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    instructor: str
    date: str
    duration_minutes: int
    max_participants: int
    registered_count: int = 0
    is_active: bool
    created_at: str

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

# ============== AUTH ROUTES ==============

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    # Check if email exists
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
        "role": "user",
        "enrolled_courses": [],
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, "user")
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": "user"
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
        "enrolled_courses": user.get("enrolled_courses", [])
    }

@api_router.put("/auth/password")
async def change_password(data: PasswordChange, user: dict = Depends(get_current_user)):
    # Get full user with password
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

# ============== COURSE ROUTES ==============

@api_router.get("/courses", response_model=List[Course])
async def get_courses(published_only: bool = True):
    query = {"is_published": True} if published_only else {}
    courses = await db.courses.find(query, {"_id": 0}).to_list(100)
    return courses

@api_router.get("/courses/{slug}")
async def get_course_by_slug(slug: str, user: dict = Depends(get_optional_user)):
    course = await db.courses.find_one({"slug": slug}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    is_enrolled = False
    if user and course["id"] in user.get("enrolled_courses", []):
        is_enrolled = True
    
    return {**course, "is_enrolled": is_enrolled}

@api_router.post("/courses/enroll")
async def enroll_in_course(data: EnrollRequest, user: dict = Depends(get_current_user)):
    course = await db.courses.find_one({"id": data.course_id}, {"_id": 0})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if data.course_id in user.get("enrolled_courses", []):
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    # Add course to user's enrolled courses
    await db.users.update_one(
        {"id": user["id"]},
        {"$push": {"enrolled_courses": data.course_id}}
    )
    
    # Increment enrolled count
    await db.courses.update_one(
        {"id": data.course_id},
        {"$inc": {"enrolled_count": 1}}
    )
    
    return {"message": "Successfully enrolled in course", "course_id": data.course_id}

@api_router.get("/my-courses", response_model=List[Course])
async def get_my_courses(user: dict = Depends(get_current_user)):
    enrolled_ids = user.get("enrolled_courses", [])
    if not enrolled_ids:
        return []
    
    courses = await db.courses.find({"id": {"$in": enrolled_ids}}, {"_id": 0}).to_list(100)
    return courses

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_courses = await db.courses.count_documents({})
    total_workshops = await db.workshops.count_documents({})
    published_courses = await db.courses.count_documents({"is_published": True})
    
    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "published_courses": published_courses,
        "total_workshops": total_workshops
    }

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/courses", response_model=List[Course])
async def get_all_courses(admin: dict = Depends(require_admin)):
    courses = await db.courses.find({}, {"_id": 0}).to_list(100)
    return courses

@api_router.post("/admin/courses", response_model=Course)
async def create_course(course_data: CourseCreate, admin: dict = Depends(require_admin)):
    # Check slug uniqueness
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
        "updated_at": now
    }
    
    await db.courses.insert_one(course_doc)
    
    # Return without _id
    del course_doc["_id"] if "_id" in course_doc else None
    return course_doc

@api_router.put("/admin/courses/{course_id}")
async def update_course(course_id: str, course_data: CourseUpdate, admin: dict = Depends(require_admin)):
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
async def delete_course(course_id: str, admin: dict = Depends(require_admin)):
    result = await db.courses.delete_one({"id": course_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}

# Workshop routes
@api_router.get("/workshops")
async def get_workshops(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    workshops = await db.workshops.find(query, {"_id": 0}).to_list(100)
    return workshops

@api_router.post("/admin/workshops", response_model=Workshop)
async def create_workshop(workshop_data: WorkshopCreate, admin: dict = Depends(require_admin)):
    workshop_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    workshop_doc = {
        "id": workshop_id,
        **workshop_data.model_dump(),
        "registered_count": 0,
        "created_at": now
    }
    
    await db.workshops.insert_one(workshop_doc)
    del workshop_doc["_id"] if "_id" in workshop_doc else None
    return workshop_doc

@api_router.delete("/admin/workshops/{workshop_id}")
async def delete_workshop(workshop_id: str, admin: dict = Depends(require_admin)):
    result = await db.workshops.delete_one({"id": workshop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return {"message": "Workshop deleted successfully"}

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "PluralSkill API is running", "version": "1.0.0"}

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
    # Check if we have any courses
    course_count = await db.courses.count_documents({})
    if course_count == 0:
        logger.info("Seeding initial course data...")
        now = datetime.now(timezone.utc).isoformat()
        
        courses = [
            {
                "id": str(uuid.uuid4()),
                "title": "Full-Stack Web Development",
                "slug": "full-stack-web-development",
                "description": "Master modern web development with React, Node.js, and MongoDB. Learn to build complete web applications from scratch with industry best practices.",
                "short_description": "Build complete web apps with React, Node.js & MongoDB",
                "thumbnail_url": "https://images.unsplash.com/photo-1581090694255-723d2dee30bc?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
                "category": "Engineering",
                "level": "intermediate",
                "duration_hours": 40,
                "price": 0,
                "modules": [
                    {"title": "HTML & CSS Fundamentals", "description": "Build solid foundations in web markup and styling", "duration_minutes": 120},
                    {"title": "JavaScript Essentials", "description": "Master modern JavaScript ES6+ features", "duration_minutes": 180},
                    {"title": "React Framework", "description": "Build dynamic user interfaces with React", "duration_minutes": 240},
                    {"title": "Node.js & Express", "description": "Create robust backend APIs", "duration_minutes": 180},
                    {"title": "MongoDB & Databases", "description": "Store and manage data effectively", "duration_minutes": 120}
                ],
                "is_published": True,
                "enrolled_count": 1250,
                "created_at": now,
                "updated_at": now
            },
            {
                "id": str(uuid.uuid4()),
                "title": "UI/UX Design Masterclass",
                "slug": "ui-ux-design-masterclass",
                "description": "Learn to create beautiful, user-friendly interfaces. From wireframing to high-fidelity prototypes, master the complete design workflow.",
                "short_description": "Create stunning interfaces with modern design principles",
                "thumbnail_url": "https://images.unsplash.com/photo-1581090697136-6bb1384e9700?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
                "category": "Design",
                "level": "beginner",
                "duration_hours": 25,
                "price": 0,
                "modules": [
                    {"title": "Design Thinking", "description": "Understand user-centered design principles", "duration_minutes": 90},
                    {"title": "Wireframing", "description": "Create effective low-fidelity mockups", "duration_minutes": 120},
                    {"title": "Figma Fundamentals", "description": "Master the industry-standard design tool", "duration_minutes": 180},
                    {"title": "Prototyping", "description": "Build interactive prototypes", "duration_minutes": 150}
                ],
                "is_published": True,
                "enrolled_count": 890,
                "created_at": now,
                "updated_at": now
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Cloud Architecture with AWS",
                "slug": "cloud-architecture-aws",
                "description": "Become a certified cloud architect. Learn to design, deploy, and manage scalable applications on Amazon Web Services.",
                "short_description": "Design scalable cloud solutions on AWS",
                "thumbnail_url": "https://images.unsplash.com/photo-1581090690193-36146cb0d813?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
                "category": "Technology",
                "level": "advanced",
                "duration_hours": 50,
                "price": 0,
                "modules": [
                    {"title": "AWS Fundamentals", "description": "Introduction to cloud computing and AWS services", "duration_minutes": 120},
                    {"title": "EC2 & Compute", "description": "Deploy and manage virtual servers", "duration_minutes": 180},
                    {"title": "S3 & Storage", "description": "Scalable storage solutions", "duration_minutes": 120},
                    {"title": "Networking & VPC", "description": "Build secure cloud networks", "duration_minutes": 150},
                    {"title": "DevOps & CI/CD", "description": "Automate deployments", "duration_minutes": 180}
                ],
                "is_published": True,
                "enrolled_count": 675,
                "created_at": now,
                "updated_at": now
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Data Science with Python",
                "slug": "data-science-python",
                "description": "Unlock the power of data. Learn Python for data analysis, visualization, and machine learning fundamentals.",
                "short_description": "Analyze data and build ML models with Python",
                "thumbnail_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
                "category": "Data Science",
                "level": "intermediate",
                "duration_hours": 35,
                "price": 0,
                "modules": [
                    {"title": "Python for Data Science", "description": "NumPy, Pandas, and data manipulation", "duration_minutes": 180},
                    {"title": "Data Visualization", "description": "Create compelling charts with Matplotlib & Seaborn", "duration_minutes": 150},
                    {"title": "Statistical Analysis", "description": "Apply statistics to real-world problems", "duration_minutes": 120},
                    {"title": "Machine Learning Basics", "description": "Build your first ML models", "duration_minutes": 240}
                ],
                "is_published": True,
                "enrolled_count": 1100,
                "created_at": now,
                "updated_at": now
            }
        ]
        
        await db.courses.insert_many(courses)
        logger.info(f"Seeded {len(courses)} courses")
    
    # Create admin user if not exists
    admin_exists = await db.users.find_one({"email": "admin@pluralskill.com"})
    if not admin_exists:
        logger.info("Creating admin user...")
        now = datetime.now(timezone.utc).isoformat()
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "admin@pluralskill.com",
            "password_hash": hash_password("admin123"),
            "first_name": "Admin",
            "last_name": "User",
            "bio": "Platform Administrator",
            "skills": ["Administration", "Management"],
            "role": "admin",
            "enrolled_courses": [],
            "created_at": now,
            "updated_at": now
        }
        await db.users.insert_one(admin_doc)
        logger.info("Admin user created: admin@pluralskill.com / admin123")
    
    # Seed workshops
    workshop_count = await db.workshops.count_documents({})
    if workshop_count == 0:
        logger.info("Seeding workshops...")
        now = datetime.now(timezone.utc).isoformat()
        workshops = [
            {
                "id": str(uuid.uuid4()),
                "title": "Building Scalable APIs",
                "description": "Live hands-on workshop on designing and building production-ready REST APIs.",
                "instructor": "Sarah Chen",
                "date": "2026-02-15T18:00:00Z",
                "duration_minutes": 90,
                "max_participants": 50,
                "registered_count": 32,
                "is_active": True,
                "created_at": now
            },
            {
                "id": str(uuid.uuid4()),
                "title": "React Performance Optimization",
                "description": "Learn advanced techniques to optimize your React applications for speed.",
                "instructor": "Michael Torres",
                "date": "2026-02-22T17:00:00Z",
                "duration_minutes": 120,
                "max_participants": 40,
                "registered_count": 28,
                "is_active": True,
                "created_at": now
            }
        ]
        await db.workshops.insert_many(workshops)
        logger.info(f"Seeded {len(workshops)} workshops")
