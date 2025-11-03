# app/schemas/common.py
from typing import Generic, List, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")

class PageResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_previous: bool
    next_page: Optional[int] = None
    previous_page: Optional[int] = None

    class Config:
        from_attributes = True

    @classmethod
    def create(cls, items: List[T], total: int, page: int, limit: int):
        total_pages = (total + limit - 1) // limit  # 페이지 수 올림 계산
        has_next = page < total_pages
        has_previous = page > 1
        next_page = page + 1 if has_next else None
        previous_page = page - 1 if has_previous else None

        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            has_next=has_next,
            has_previous=has_previous,
            next_page=next_page,
            previous_page=previous_page
        )
