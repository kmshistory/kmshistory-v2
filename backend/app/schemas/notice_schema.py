from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.common import PageResponse

class NoticeCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="카테고리명")
    order: int = Field(default=0, description="정렬 순서")
    is_active: bool = Field(default=True, description="활성 상태")


class NoticeCategoryCreate(NoticeCategoryBase):
    pass


class NoticeCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="카테고리명")
    order: Optional[int] = Field(None, description="정렬 순서")
    is_active: Optional[bool] = Field(None, description="활성 상태")


class NoticeCategoryResponse(NoticeCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoticeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="제목")
    content: str = Field(..., description="내용")
    category_id: int = Field(..., description="카테고리 ID")
    publish_status: str = Field(default="published", description="발행 상태 (published/scheduled/private)")
    published_at: Optional[datetime] = Field(None, description="발행일")


class NoticeCreate(NoticeBase):
    pass


class NoticeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100, description="제목")
    content: Optional[str] = Field(None, description="내용")
    category_id: Optional[int] = Field(None, description="카테고리 ID")
    publish_status: Optional[str] = Field(None, description="발행 상태 (published/scheduled/private)")
    published_at: Optional[datetime] = Field(None, description="발행일")


class NoticeResponse(NoticeBase):
    id: int
    author_id: int
    author_nickname: Optional[str] = None
    category_name: Optional[str] = None
    views: int = 0
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NoticePageResponse(PageResponse[NoticeResponse]):
    pass

