from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, get_optional_user
from app.db.session import db
from app.models.certificate import Certificate

router = APIRouter()


@router.get("/certificates")
async def get_my_certificates(user: dict = Depends(get_current_user)):
    """Get all certificates for current user"""
    certificates = await db.certificates.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).to_list(100)
    return certificates


@router.get("/certificates/{certificate_id}")
async def get_certificate(certificate_id: str, user: dict = Depends(get_optional_user)):
    """Get certificate details - public for verification"""
    certificate = await db.certificates.find_one(
        {"$or": [{"id": certificate_id}, {"certificate_number": certificate_id}]},
        {"_id": 0},
    )
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return certificate


@router.get("/certificates/verify/{certificate_number}")
async def verify_certificate(certificate_number: str):
    """Verify a certificate by its number - public endpoint"""
    certificate = await db.certificates.find_one(
        {"certificate_number": certificate_number}, {"_id": 0}
    )
    if not certificate:
        return {"valid": False, "message": "Certificate not found"}

    return {
        "valid": True,
        "certificate_number": certificate["certificate_number"],
        "user_name": certificate["user_name"],
        "course_title": certificate["course_title"],
        "issued_at": certificate["issued_at"],
        "quiz_score": certificate["quiz_score"],
    }
