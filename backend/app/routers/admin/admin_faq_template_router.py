from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie
from app.services.faq_service import (
    admin_list_faqs_service,
    admin_get_faq_service,
)
from app.models import FAQCategory

router = APIRouter(
    prefix="/admin/faq",
    tags=["백오피스 FAQ(템플릿)"],
)

@router.get("", response_class=HTMLResponse)
async def admin_faq_list_page(
    request: Request,
    page: int = 1,
    search: str | None = None,
    category_id: str | None = None,
    db: Session = Depends(get_db),
):
    # 인증/인가 (리다이렉트 UX 유지)
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)
    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    page_res, categories = admin_list_faqs_service(
        request=request, db=db, page=page, limit=10, search=search, category_id=category_id
    )
    return templates.TemplateResponse(
        "backoffice/faq/faq_list.html",
        {
            "request": request,
            "faqs": page_res.items,
            "categories": categories,
            "current_page": page_res.page,
            "total_pages": page_res.total_pages,
            "total_count": page_res.total,
            "search": search,
            "selected_category": category_id,
            "title": "FAQ 관리",
        },
    )

@router.get("/new", response_class=HTMLResponse)
async def admin_faq_new_page(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)
    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    categories = (
        db.query(FAQCategory)
        .filter(FAQCategory.is_active == True)
        .order_by(FAQCategory.order.asc())
        .all()
    )
    return templates.TemplateResponse(
        "backoffice/faq/faq_create.html",
        {"request": request, "categories": categories, "title": "FAQ 작성"},
    )

@router.get("/{faq_id}", response_class=HTMLResponse)
async def admin_faq_detail_page(
    request: Request, faq_id: int, db: Session = Depends(get_db)
):
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)
    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    faq = admin_get_faq_service(request, db, faq_id)
    return templates.TemplateResponse(
        "backoffice/faq/faq_detail.html",
        {"request": request, "faq": faq, "title": "FAQ 상세보기"},
    )

@router.get("/{faq_id}/edit", response_class=HTMLResponse)
async def admin_faq_edit_page(
    request: Request, faq_id: int, db: Session = Depends(get_db)
):
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)
    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    faq = admin_get_faq_service(request, db, faq_id)
    categories = (
        db.query(FAQCategory)
        .filter(FAQCategory.is_active == True)
        .order_by(FAQCategory.order.asc())
        .all()
    )
    return templates.TemplateResponse(
        "backoffice/faq/faq_edit.html",
        {
            "request": request,
            "faq": faq,
            "categories": categories,
            "title": "FAQ 수정",
        },
    )
