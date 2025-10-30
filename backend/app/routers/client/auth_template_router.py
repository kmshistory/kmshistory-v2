# app/routers/auth_template_router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import auth_service
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie

router = APIRouter(tags=["Auth:Templates"])

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request, "title": "로그인"})

@router.post("/login")
async def login_submit(request: Request, db: Session = Depends(get_db)):
    from fastapi import Response
    response = Response()
    await auth_service.login_service(request, response, db)
    # 쿠키 세팅된 응답으로 리다이렉트
    r = RedirectResponse(url="/", status_code=303)
    for k, v in response.headers.items():
        r.headers[k] = v
    return r

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse("auth/register.html", {"request": request, "title": "회원가입"})

@router.post("/register")
async def register_submit(request: Request, db: Session = Depends(get_db)):
    await auth_service.register_service(request, db)
    return RedirectResponse(url="/login?registered=1", status_code=303)

@router.post("/logout")
async def logout_submit():
    from fastapi import Response
    response = Response()
    auth_service.logout_service(response)
    r = RedirectResponse(url="/", status_code=303)
    for k, v in response.headers.items():
        r.headers[k] = v
    return r

@router.get("/auth/forgot-password", response_class=HTMLResponse)
async def forgot_password_page(request: Request):
    return templates.TemplateResponse(
        "client/auth/find_password.html",
        {"request": request, "title": "비밀번호 찾기"}
    )

@router.get("/auth/reset-password", response_class=HTMLResponse)
async def reset_password_page(request: Request):
    return templates.TemplateResponse(
        "client/auth/reset_password.html",
        {"request": request, "title": "비밀번호 재설정"}
    )

@router.get("/admin-required", response_class=HTMLResponse)
async def admin_required_page(request: Request):
    return templates.TemplateResponse(
        "client/auth/admin_required.html",
        {"request": request, "title": "관리자 전용"}
    )

@router.get("/member-required", response_class=HTMLResponse)
async def member_required_page(request: Request):
    return templates.TemplateResponse(
        "client/auth/member_required.html",
        {"request": request, "title": "일반 사용자 전용"}
    )

