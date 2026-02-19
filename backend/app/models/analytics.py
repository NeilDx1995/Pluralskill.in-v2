from pydantic import BaseModel


class AccessLog(BaseModel):
    user_id: str
    content_type: str  # course, lab, workshop, open_source
    content_id: str
    action: str  # view, enroll, complete, start
    timestamp: str
