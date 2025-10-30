from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.templates import templates
from app.services.faq_service import (
    client_list_faqs_service,
    client_get_faq_service,
)

router = APIRouter(
    prefix="",
    tags=["클라이언트 FAQ(템플릿)"],
)

@router.get("/faq", response_class=HTMLResponse)
async def client_faq_list_page(
    request: Request,
    search: str | None = None,
    category_id: str | None = None,
    page: int = 1,
    db: Session = Depends(get_db),
):
    page_res, categories = client_list_faqs_service(
        db=db, page=page, limit=5, search=search, category_id=category_id
    )

    return templates.TemplateResponse(
        "client/faq/faq_list.html",
        {
            "request": request,
            "faqs": page_res.items,
            "categories": categories,
            "search": search,
            "selected_category": category_id,
            "title": "자주 묻는 질문",
            "current_page": page_res.page,
            "total_pages": page_res.total_pages,
            "total_count": page_res.total,
        },
    )
