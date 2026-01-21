from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie
from app.services.dashboard_service import dashboard_service

router = APIRouter(tags=["Admin:Dashboard:Templates"])

@router.get("/admin", response_class=HTMLResponse)
async def admin_dashboard(request: Request, db: Session = Depends(get_db)):
    """관리자 대시보드 메인 페이지"""
    try:
        current_user = get_current_user_from_cookie(request, db)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=303)

    if current_user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    # ✅ 통계 요약
    stats = dashboard_service.get_summary_stats(db)
    # ✅ 최근 활동
    recent = dashboard_service.get_recent_activity(db)
    # ✅ 다가오는 일정 (Google Calendar)
    upcoming_events = dashboard_service.get_upcoming_events()
    # ✅ 최근 알림 (Notification)
    recent_notifications = dashboard_service.get_recent_notifications(db)

    return templates.TemplateResponse(
        "backoffice/dashboard/dashboard.html",
        {
            "request": request,
            "user": current_user,
            "title": "관리자 대시보드",
            # 통계
            "stats": stats,
            # 최근 DB 활동
            "recent_users": recent["recent_users"],
            "recent_draws": recent["recent_draws"],
            "recent_notifications": recent["recent_notifications"],
            # 구글 일정 + 알림 요약
            "upcoming_events": upcoming_events,
            "new_notifications": recent_notifications,
        },
    )
