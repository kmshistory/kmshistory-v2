from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie

router = APIRouter(tags=["Calendar:Templates"])

@router.get("/schedule", response_class=HTMLResponse)
async def client_schedule_page(request: Request):
    """클라이언트 일정 페이지"""
    return templates.TemplateResponse(
        "client/schedule/schedule.html",
        {"request": request, "title": "일정"}
    )

@router.get("/admin/schedule", response_class=HTMLResponse)
async def admin_schedule_page(request: Request, db: Session = Depends(get_db)):
    """백오피스 일정 관리 페이지"""
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)
    return templates.TemplateResponse(
        "backoffice/schedule/schedule.html",
        {"request": request, "user": user, "title": "일정 관리"}
    )
