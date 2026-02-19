import uuid
from datetime import datetime, timezone

from app.db.session import db


async def log_access(user_id: str, content_type: str, content_id: str, action: str):
    """Log user access for analytics"""
    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "content_type": content_type,
        "content_id": content_id,
        "action": action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.access_logs.insert_one(log_doc)
