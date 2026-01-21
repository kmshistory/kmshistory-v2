from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.templates import templates
from app.services.notice_service import (
    client_list_notices_service,
    client_get_notice_service,
)

router = APIRouter(
    prefix="",
    tags=["클라이언트 공지사항(템플릿)"],
)


@router.get("/notices", response_class=HTMLResponse)
async def client_notice_list_page(
    request: Request,
    page: int = 1,
    search: str | None = None,
    category_id: str | None = None,
    db: Session = Depends(get_db),
):
    page_res, categories = client_list_notices_service(
        db=db, page=page, limit=10, search=search, category_id=category_id
    )

    return templates.TemplateResponse(
        "client/notices/notice_list.html",
        {
            "request": request,
            "notices": page_res.items,
            "categories": categories,
            "current_page": page_res.page,
            "total_pages": page_res.total_pages,
            "total_count": page_res.total,
            "search": search,
            "selected_category": category_id,
            "title": "공지사항",
        },
    )


@router.get("/notices/{notice_id}", response_class=HTMLResponse)
async def client_notice_detail_page(
    request: Request, notice_id: int, db: Session = Depends(get_db)
):
    notice = client_get_notice_service(db, notice_id)
    return templates.TemplateResponse(
        "client/notices/notice_detail.html",
        {"request": request, "notice": notice, "title": notice.title},
    )
