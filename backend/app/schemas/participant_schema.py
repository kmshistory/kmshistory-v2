# app/schemas/participant_schema.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class ParticipantCreate(BaseModel):
    """대상자 생성/수정 요청용 스키마"""
    name: str = Field(..., max_length=100, description="이름")
    email: EmailStr = Field(..., description="이메일")
    description: Optional[str] = Field(None, max_length=500, description="상세 설명")


class ParticipantResponse(BaseModel):
    """대상자 응답 스키마"""
    id: int
    name: str
    email: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
