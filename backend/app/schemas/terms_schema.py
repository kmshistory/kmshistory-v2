from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class TermsBase(BaseModel):
    key: str
    title: str
    content: str
    is_active: bool = True

class TermsResponse(TermsBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class TermsListResponse(BaseModel):
    terms: List[TermsResponse]
    total_count: int
