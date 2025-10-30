from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/api/admin/dashboard", tags=["Admin:Dashboard"])

def require_admin(request, db):
    """관리자 권한 확인 헬퍼"""
    user = get_current_user_from_cookie(request, db)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user


# ✅ 1️⃣ 대시보드 요약 통계 + 다가오는 일정 + 알림
@router.get("/overview")
async def get_dashboard_overview(request: Request, db: Session = Depends(get_db)):
    """
    관리자 대시보드 요약 정보:
    - 회원/참가자/추첨 통계
    - 다가오는 일정 (Google Calendar)
    - 최근 알림 (Notification)
    """
    require_admin(request, db)
    
    stats = dashboard_service.get_summary_stats(db)
    upcoming_events = dashboard_service.get_upcoming_events()
    recent_notifications = dashboard_service.get_recent_notifications(db)

    return {
        "summary": stats,
        "upcoming_events": upcoming_events,
        "recent_notifications": recent_notifications
    }


# ✅ 2️⃣ 최근 활동 내역 (회원가입, 추첨, 알림 등)
@router.get("/recent-activity")
async def get_recent_activity(request: Request, db: Session = Depends(get_db)):
    """최근 활동 내역 (회원, 추첨, 알림 등 10개)"""
    require_admin(request, db)
    data = dashboard_service.get_recent_activity(db)
    return data
