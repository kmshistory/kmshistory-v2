from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class TermsBase(BaseModel):
    key: str
    title: str
    content: str
    is_active: bool = True

class TermsCreate(TermsBase):
    """약관 생성 스키마"""
    pass

class TermsUpdate(BaseModel):
    """약관 수정 스키마"""
    key: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

class TermsResponse(TermsBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class TermsListResponse(BaseModel):
    terms: List[TermsResponse]
    total_count: int
