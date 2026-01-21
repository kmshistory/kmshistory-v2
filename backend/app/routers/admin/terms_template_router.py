from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie

router = APIRouter(tags=["Admin:Terms:Templates"])

# @router.get("/admin/settings", response_class=HTMLResponse)  # React로 대체됨
# async def settings_page(request: Request, db: Session = Depends(get_db)):
#     """관리자 설정 + 약관 관리 페이지"""
#     user = get_current_user_from_cookie(request, db)
#     if user.role != "admin":
#         return RedirectResponse(url="/admin-required", status_code=303)
#
#     return templates.TemplateResponse(
#         "backoffice/settings/settings_management.html",
#         {"request": request, "user": user, "title": "기본 설정"}
#     )

# @router.get("/terms", response_class=HTMLResponse)  # React로 대체됨
# async def terms_page(request: Request):
#     return templates.TemplateResponse("client/policies/terms_of_service.html", {"request": request, "title": "이용약관"})

# @router.get("/privacy", response_class=HTMLResponse)  # React로 대체됨
# async def privacy_page(request: Request):
#     return templates.TemplateResponse("client/policies/privacy_policy.html", {"request": request, "title": "개인정보처리방침"})
