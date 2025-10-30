from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.common import PageResponse


# -------------------------------
# 🔹 기본 스키마 (요청/응답 공통)
# -------------------------------

class DrawRecordBase(BaseModel):
    """추첨 기본 스키마"""
    title: str = Field(..., max_length=200, description="추첨 제목")
    content: Optional[str] = Field(None, description="추첨 내용")
    draw_datetime: datetime = Field(..., description="추첨 일시")
    total_participants: Optional[int] = Field(None, description="전체 대상자 수")
    winner_count: Optional[int] = Field(None, description="당첨자 수")
    upload_file_id: Optional[int] = Field(None, description="업로드 파일 ID")


# -------------------------------
# 🔹 생성 / 수정 요청용
# -------------------------------

class DrawRecordCreate(DrawRecordBase):
    """추첨 생성 요청 스키마"""
    winners: Optional[List[dict]] = Field(
        None,
        description="당첨자 목록 (name, email 포함)"
    )


class DrawRecordUpdate(BaseModel):
    """추첨 수정 요청 스키마"""
    title: Optional[str] = None
    content: Optional[str] = None
    draw_datetime: Optional[datetime] = None
    total_participants: Optional[int] = None
    winner_count: Optional[int] = None


# -------------------------------
# 🔹 응답 스키마
# -------------------------------

class DrawParticipantResponse(BaseModel):
    """추첨 대상자 응답"""
    id: int
    draw_record_id: int
    participant_number: int
    name: str
    email: str
    description: Optional[str]
    is_winner: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DrawRecordResponse(DrawRecordBase):
    """추첨 기록 응답"""
    id: int
    created_at: datetime
    updated_at: datetime
    participants: Optional[List[DrawParticipantResponse]] = None

    class Config:
        from_attributes = True


# -------------------------------
# 🔹 페이징 응답
# -------------------------------

class DrawRecordPageResponse(PageResponse[DrawRecordResponse]):
    """추첨 목록 페이징 응답"""
    pass
