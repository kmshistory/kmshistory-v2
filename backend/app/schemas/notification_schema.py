from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.common import PageResponse

class NotificationBase(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    is_read: Optional[bool] = False
    related_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    """알림 생성 스키마"""
    pass

class NotificationUpdate(BaseModel):
    """알림 수정 스키마"""
    type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    is_read: Optional[bool] = None
    related_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total_count: int

class NotificationPageResponse(PageResponse[NotificationResponse]):
    """알림 페이징 응답"""
    pass

class RecentActivityItem(BaseModel):
    id: str
    type: str
    title: str
    timestamp: Optional[datetime]
    data: dict
