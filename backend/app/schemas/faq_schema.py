from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.common import PageResponse

# ---------- Category ----------

class FAQCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    order: int = 0
    is_active: bool = True

class FAQCategoryCreate(FAQCategoryBase):
    pass

class FAQCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    order: Optional[int] = None
    is_active: Optional[bool] = None

class FAQCategoryResponse(FAQCategoryBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ---------- FAQ ----------

class FAQResponse(BaseModel):
    id: int
    question: str
    answer: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    order: int
    is_active: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FAQPageResponse(PageResponse[FAQResponse]):
    pass
