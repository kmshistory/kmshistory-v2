from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie

router = APIRouter(tags=["Admin:Notifications:Templates"])

@router.get("/admin/notifications", response_class=HTMLResponse)
async def admin_notifications_page(request: Request, db: Session = Depends(get_db)):
    """관리자 알림 센터"""
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    return templates.TemplateResponse(
        "backoffice/notifications/notifications.html",
        {"request": request, "user": user, "title": "알림 센터"}
    )
