from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie
from app.services.notice_service import (
    admin_list_notices_service,
    admin_get_notice_service,
)
from app.models import NoticeCategory

router = APIRouter(
    prefix="/admin/notices",
    tags=["백오피스 공지사항(템플릿)"],
)


@router.get("", response_class=HTMLResponse)
async def admin_notice_list_page(
    request: Request,
    page: int = 1,
    search: str | None = None,
    category_id: str | None = None,
    db: Session = Depends(get_db),
):
    # 로그인 & 권한
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)
    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    page_res, categories = admin_list_notices_service(
        request=request,
        db=db,
        page=page,
        limit=10,
        search=search,
        category_id=category_id,
    )

    return templates.TemplateResponse(
        "backoffice/notices/notice_list.html",
        {
            "request": request,
            "user": current_user,
            "notices": page_res.items,
            "categories": categories,
            "current_page": page_res.page,
            "total_pages": page_res.total_pages,
            "total_count": page_res.total,
            "search": search,
            "selected_category": category_id,
            "title": "공지사항 관리",
        },
    )


@router.get("/create", response_class=HTMLResponse)
async def admin_notice_create_page(
    request: Request, db: Session = Depends(get_db)
):
    # 로그인 & 권한
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)
    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    categories = (
        db.query(NoticeCategory)
        .filter(NoticeCategory.is_active == True)
        .order_by(NoticeCategory.order)
        .all()
    )

    return templates.TemplateResponse(
        "backoffice/notices/notice_create.html",
        {
            "request": request,
            "user": current_user,
            "categories": categories,
            "title": "공지사항 작성",
        },
    )


@router.get("/{notice_id}", response_class=HTMLResponse)
async def admin_notice_detail_page(
    request: Request, notice_id: int, db: Session = Depends(get_db)
):
    # 로그인 & 권한
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)
    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    notice = admin_get_notice_service(request, db, notice_id)

    return templates.TemplateResponse(
        "backoffice/notices/notice_detail.html",
        {
            "request": request,
            "user": current_user,
            "notice": notice,
            "title": f"공지사항 상세 - {notice.title}",
        },
    )


@router.get("/{notice_id}/edit", response_class=HTMLResponse)
async def admin_notice_edit_page(
    request: Request, notice_id: int, db: Session = Depends(get_db)
):
    # 로그인 & 권한
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)
    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    notice = admin_get_notice_service(request, db, notice_id)
    categories = (
        db.query(NoticeCategory)
        .filter(NoticeCategory.is_active == True)
        .order_by(NoticeCategory.order)
        .all()
    )

    return templates.TemplateResponse(
        "backoffice/notices/notice_edit.html",
        {
            "request": request,
            "user": current_user,
            "notice": notice,
            "categories": categories,
            "title": f"공지사항 수정 - {notice.title}",
        },
    )
