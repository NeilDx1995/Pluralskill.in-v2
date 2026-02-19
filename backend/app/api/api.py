from fastapi import APIRouter

from app.api.endpoints import (assignments, auth, certificates, courses, labs,
                               learning_paths, upload, users, workshops)

api_router = APIRouter()

# Auth: /api/auth/login, /api/auth/register
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Users: /api/users/me
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Courses: /api/courses/, /api/courses/{id}
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])

# Workshops: /api/workshops/, /api/workshops/{id}/register
api_router.include_router(workshops.router, prefix="/workshops", tags=["workshops"])

# Learning Paths: /api/learning-paths/generate (path embedded in endpoint)
api_router.include_router(learning_paths.router, tags=["learning_paths"])

# Labs: /api/labs, /api/labs/{slug} (path embedded in endpoint)
api_router.include_router(labs.router, tags=["labs"])

# Assignments: /api/courses/{id}/assignments, /api/assignments/{id}/submit (path embedded)
api_router.include_router(assignments.router, tags=["assignments"])

# Certificates: /api/certificates (path embedded)
api_router.include_router(certificates.router, tags=["certificates"])

# Upload: /api/upload/image, /api/upload/video, /api/upload/document (path embedded)
api_router.include_router(upload.router, tags=["upload"])
