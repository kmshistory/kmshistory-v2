from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NotificationBase(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    is_read: Optional[bool] = False
    related_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total_count: int

class RecentActivityItem(BaseModel):
    id: str
    type: str
    title: str
    timestamp: Optional[datetime]
    data: dict
