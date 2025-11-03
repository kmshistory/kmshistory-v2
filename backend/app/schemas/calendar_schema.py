from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CalendarEventBase(BaseModel):
    summary: str = Field(..., description="일정 제목")
    start: str = Field(..., description="시작 시간 (ISO 8601)")
    end: str = Field(..., description="종료 시간 (ISO 8601)")
    description: Optional[str] = Field(None, description="설명")
    location: Optional[str] = Field(None, description="장소")


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    summary: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None


class CalendarEventResponse(CalendarEventBase):
    id: str
    htmlLink: Optional[str] = None
    created: Optional[datetime] = None
    updated: Optional[datetime] = None
    status: Optional[str] = None
    visibility: Optional[str] = None
    transparency: Optional[str] = None

    class Config:
        from_attributes = True


class CalendarEventListResponse(BaseModel):
    events: List[CalendarEventResponse]
    total_count: int
