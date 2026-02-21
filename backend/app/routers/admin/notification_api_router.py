from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services.notification_service import notification_service
from app.schemas.notification_schema import (
    NotificationListResponse, NotificationResponse, RecentActivityItem
)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# 공통 관리자 인증 함수
def require_admin(request: Request, db: Session):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    return user

@router.get("", response_model=NotificationListResponse)
async def list_notifications(request: Request, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    require_admin(request, db)
    notifications, total = notification_service.list_notifications(db, skip, limit)
    return {"notifications": notifications, "total_count": total}

@router.put("/{notification_id}/read")
async def mark_as_read(request: Request, notification_id: int, db: Session = Depends(get_db)):
    require_admin(request, db)
    return notification_service.mark_as_read(db, notification_id)

@router.put("/mark-all-read")
async def mark_all_as_read(request: Request, db: Session = Depends(get_db)):
    require_admin(request, db)
    return notification_service.mark_all_as_read(db)

@router.delete("/clear-all")
async def clear_all(request: Request, db: Session = Depends(get_db)):
    require_admin(request, db)
    return notification_service.clear_all(db)

@router.delete("/{notification_id}")
async def delete_notification(request: Request, notification_id: int, db: Session = Depends(get_db)):
    require_admin(request, db)
    return notification_service.delete_notification(db, notification_id)

# 최근 활동 조회
@router.get("/recent", response_model=list[RecentActivityItem])
async def recent_activity(request: Request, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    require_admin(request, db)
    return notification_service.get_recent_activity(db, skip, limit)
