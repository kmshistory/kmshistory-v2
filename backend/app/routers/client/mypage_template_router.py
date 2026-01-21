# app/routers/mypage_template_router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie
from datetime import datetime

router = APIRouter(tags=["MyPage:Templates"])

# 마이페이지 메인
@router.get("/mypage", response_class=HTMLResponse)
async def mypage_main(request: Request, db: Session = Depends(get_db)):
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)

    if current_user.role == "admin":
        return RedirectResponse(url="/member-required", status_code=303)

    return templates.TemplateResponse(
        "client/mypage/mypage_main.html",
        {"request": request, "user": current_user, "title": "마이페이지"},
    )

# @router.get("/mypage/edit_profile", response_class=HTMLResponse)  # React로 대체됨
# async def mypage_edit_profile(request: Request, db: Session = Depends(get_db)):
#     try:
#         current_user = get_current_user_from_cookie(request, db)
#     except HTTPException:
#         return RedirectResponse(url="/login", status_code=303)
#
#     return templates.TemplateResponse(
#         "client/mypage/edit_profile.html",
#         {"request": request, "user": current_user, "title": "정보수정"},
#     )

# @router.get("/mypage/change-password", response_class=HTMLResponse)  # React로 대체됨
# async def mypage_change_password_page(request: Request, db: Session = Depends(get_db)):
#     try:
#         current_user = get_current_user_from_cookie(request, db)
#     except HTTPException:
#         return RedirectResponse(url="/login", status_code=303)
#
#     return templates.TemplateResponse(
#         "client/mypage/change_password.html",
#         {"request": request, "user": current_user, "title": "비밀번호 변경"},
#     )

# @router.get("/mypage/withdraw", response_class=HTMLResponse)  # React로 대체됨
# async def mypage_withdraw_page(request: Request, db: Session = Depends(get_db)):
#     try:
#         current_user = get_current_user_from_cookie(request, db)
#     except HTTPException:
#         return RedirectResponse(url="/login", status_code=303)
#
#     return templates.TemplateResponse(
#         "client/mypage/withdraw.html",
#         {"request": request, "user": current_user, "title": "회원탈퇴"},
#     )
