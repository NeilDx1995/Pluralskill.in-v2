import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.config import settings
from app.core.security import get_current_user, require_trainer_or_admin
from app.services.storage import StorageService

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Storage Service
# We need to define where uploads go.
# For now, let's use a default path relative to where app is run, or from settings.
# server.py used ROOT_DIR / "uploads".
UPLOAD_DIR = Path("uploads")
storage_service = StorageService(upload_dir=UPLOAD_DIR)

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]


@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...), user: dict = Depends(require_trainer_or_admin)
):
    """Upload an image file for course/workshop banners"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Invalid file type. Allowed: JPEG, PNG, WebP, GIF"
        )

    # Check file size defined in settings? Or use raw value.
    # settings.MAX_VIDEO_SIZE exists but not MAX_IMAGE_SIZE in extract.
    # Let's use 10MB
    MAX_IMAGE_SIZE = 10 * 1024 * 1024

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: 10MB")

    try:
        result = await storage_service.upload_file(file, "images")
        logger.info(f"Image uploaded: {result['url']} by user {user['id']}")
        return result
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="File upload failed")


@router.post("/upload/video")
async def upload_video(
    file: UploadFile = File(...), user: dict = Depends(require_trainer_or_admin)
):
    """Upload a video file for course modules"""
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Invalid file type. Allowed: {ALLOWED_VIDEO_TYPES}"
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > settings.MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.MAX_VIDEO_SIZE // (1024*1024)}MB",
        )

    try:
        result = await storage_service.upload_file(file, "videos")
        logger.info(f"Video uploaded: {result['url']} by user {user['id']}")
        return result
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="File upload failed")


@router.post("/upload/document")
async def upload_document(
    file: UploadFile = File(...), user: dict = Depends(require_trainer_or_admin)
):
    """Upload a document file for course materials"""
    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=400, detail=f"Invalid file type. Allowed: PDF, PPTX, DOCX"
        )

    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > settings.MAX_DOC_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {settings.MAX_DOC_SIZE // (1024*1024)}MB",
        )

    try:
        result = await storage_service.upload_file(file, "documents")
        logger.info(f"Document uploaded: {result['url']} by user {user['id']}")
        return result
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="File upload failed")
