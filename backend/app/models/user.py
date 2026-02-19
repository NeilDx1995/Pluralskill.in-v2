from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional

class User(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    bio: Optional[str] = None
    skills: List[str] = []
    
    model_config = ConfigDict(from_attributes=True)

class UserInDB(User):
    id: str
    password_hash: str
    role: str = "learner" # learner, trainer, admin
    enrolled_courses: List[str] = [] # List of course IDs
    completed_labs: List[str] = [] # List of lab IDs
    created_at: str
    updated_at: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    bio: Optional[str] = None
    skills: List[str] = []
    role: str
    created_at: str

class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
