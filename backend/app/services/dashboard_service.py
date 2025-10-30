from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.models import User, Participant, DrawRecord, Notification
from app.services.calendar_service import calendar_service   # ✅ 추가
from app.services.notification_service import notification_service  # ✅ 추가


class DashboardService:
    """관리자 대시보드 서비스"""

    def get_summary_stats(self, db: Session):
        """관리자 통계 요약 데이터"""
        try:
            # 전체 회원 수 (삭제되지 않은 사용자)
            total_users = db.query(User).filter(User.deleted_at.is_(None)).count()

            # 전체 대상자 수
            total_participants = db.query(Participant).count()
            participants_with_email = db.query(Participant).filter(Participant.email.isnot(None)).count()
            participants_with_description = db.query(Participant).filter(Participant.description.isnot(None)).count()

            # 전체 추첨 수
            total_draws = db.query(DrawRecord).count()

            # 읽지 않은 알림 수
            unread_notifications = db.query(Notification).filter(Notification.is_read == False).count()

            return {
                "total_users": total_users,
                "total_participants": total_participants,
                "participants_with_email": participants_with_email,
                "participants_with_description": participants_with_description,
                "total_draws": total_draws,
                "unread_notifications": unread_notifications,
            }
        except Exception as e:
            raise HTTPException(500, f"요약 통계 조회 중 오류: {str(e)}")

    def get_recent_activity(self, db: Session, limit: int = 10):
        """최근 활동 내역"""
        try:
            recent_draws = db.query(DrawRecord).order_by(DrawRecord.created_at.desc()).limit(limit).all()
            recent_users = db.query(User).filter(User.deleted_at.is_(None)).order_by(User.created_at.desc()).limit(limit).all()
            recent_notifications = db.query(Notification).order_by(Notification.created_at.desc()).limit(limit).all()

            return {
                "recent_users": recent_users,
                "recent_draws": recent_draws,
                "recent_notifications": recent_notifications,
            }
        except Exception as e:
            raise HTTPException(500, f"최근 활동 조회 중 오류: {str(e)}")

    def get_upcoming_events(self):
        """다가오는 일정 (Google Calendar)"""
        try:
            now = datetime.utcnow()
            week_later = now + timedelta(days=7)
            events = calendar_service.list_events(
                start_date=now.isoformat(),
                end_date=week_later.isoformat()
            )
            upcoming = []
            for e in events:
                upcoming.append({
                    "summary": e.get("summary"),
                    "start": e.get("start"),
                    "end": e.get("end"),
                    "location": e.get("location", ""),
                    "htmlLink": e.get("htmlLink", ""),
                })
            return upcoming[:5]
        except Exception as e:
            raise HTTPException(500, f"다가오는 일정 조회 중 오류: {str(e)}")

    def get_recent_notifications(self, db: Session, limit: int = 5):
        """최근 알림 목록"""
        try:
            notifications, _ = notification_service.list_notifications(db, limit=limit)
            return [
                {
                    "title": n.title,
                    "type": n.type,
                    "created_at": n.created_at,
                    "is_read": n.is_read,
                }
                for n in notifications
            ]
        except Exception as e:
            raise HTTPException(500, f"최근 알림 조회 중 오류: {str(e)}")


dashboard_service = DashboardService()
