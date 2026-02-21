from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NoticeNeighbor(BaseModel):
    id: int
    title: str
    published_at: Optional[datetime] = None


class NoticeNeighborsResponse(BaseModel):
    prev: Optional[NoticeNeighbor] = None  # 목록 상단 (더 최신글)
    next: Optional[NoticeNeighbor] = None  # 목록 하단 (더 과거글)
