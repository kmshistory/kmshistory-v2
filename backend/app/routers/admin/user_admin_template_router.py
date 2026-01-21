# app/routers/users_admin_template_router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie
from app.services import user_service

router = APIRouter(tags=["Admin:Users:Templates"])

def require_admin(request: Request, db: Session):
    """관리자 인증 헬퍼"""
    current_user = get_current_user_from_cookie(request, db)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return current_user

# ==========================
# 관리자 사용자 목록 페이지
# ==========================
@router.get("/admin/users", response_class=HTMLResponse)
async def users_list_page(
    request: Request,
    page: int = 1,
    q: str | None = None,
    role: str | None = None,
    is_active: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    admin = require_admin(request, db)

    # 최신 서비스 기반 목록 조회
    page_obj = user_service.list_users_admin(
        db, page=page, limit=10, q=q, role=role, is_active=is_active, status=status
    )

    return templates.TemplateResponse(
        "backoffice/users/user_list.html",
        {
            "request": request,
            "user": admin,
            "users": page_obj.items,
            "current_page": page_obj.page,
            "total_pages": page_obj.total_pages,
            "total_count": page_obj.total,
            "q": q,
            "role": role,
            "is_active": is_active,
            "status": status,
            "title": "사용자 관리",
        },
    )

# ==========================
# 관리자 사용자 상세 페이지
# ==========================
@router.get("/admin/users/{user_id}", response_class=HTMLResponse)
async def user_detail_page(request: Request, user_id: int, db: Session = Depends(get_db)):
    admin = require_admin(request, db)
    target = user_service.get_user_admin(db, user_id)
    return templates.TemplateResponse(
        "backoffice/users/user_detail.html",
        {
            "request": request,
            "user": admin,
            "target": target,
            "title": f"사용자 상세 - {target.nickname}",
        },
    )

# ==========================
# 관리자 사용자 수정 페이지
# ==========================
@router.get("/admin/users/{user_id}/edit", response_class=HTMLResponse)
async def user_edit_page(request: Request, user_id: int, db: Session = Depends(get_db)):
    admin = require_admin(request, db)
    target = user_service.get_user_admin(db, user_id)
    return templates.TemplateResponse(
        "backoffice/users/user_edit.html",
        {
            "request": request,
            "user": admin,
            "target": target,
            "title": f"사용자 수정 - {target.nickname}",
        },
    )
