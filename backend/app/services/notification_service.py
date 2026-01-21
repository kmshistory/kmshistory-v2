from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException
from datetime import datetime
from app.models import Notification, User, DrawRecord

class NotificationService:
    """알림 비즈니스 로직"""

    def list_notifications(self, db: Session, skip: int = 0, limit: int = 100):
        """알림 목록 조회"""
        query = db.query(Notification).order_by(desc(Notification.created_at))
        total = query.count()
        notifications = query.offset(skip).limit(limit).all()
        return notifications, total

    def mark_as_read(self, db: Session, notification_id: int):
        """단일 알림 읽음 표시"""
        n = db.query(Notification).filter(Notification.id == notification_id).first()
        if not n:
            raise HTTPException(404, "알림을 찾을 수 없습니다.")
        n.is_read = True
        db.commit()
        return {"message": "읽음 처리 완료"}

    def mark_all_as_read(self, db: Session):
        """전체 읽음 처리"""
        db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
        db.commit()
        return {"message": "전체 알림 읽음 처리 완료"}

    def delete_notification(self, db: Session, notification_id: int):
        """단일 알림 삭제"""
        n = db.query(Notification).filter(Notification.id == notification_id).first()
        if not n:
            raise HTTPException(404, "알림을 찾을 수 없습니다.")
        db.delete(n)
        db.commit()
        return {"message": "삭제 완료"}

    def clear_all(self, db: Session):
        """모든 알림 삭제"""
        db.query(Notification).delete()
        db.commit()
        return {"message": "모든 알림 삭제 완료"}

    def get_recent_activity(self, db: Session, skip: int = 0, limit: int = 50):
        """최근 활동 조회 (사용자/추첨 기준)"""
        users = db.query(User).order_by(desc(User.created_at)).limit(5).all()
        draws = db.query(DrawRecord).order_by(desc(DrawRecord.created_at)).limit(5).all()

        activities = []

        for u in users:
            activities.append({
                "id": f"user_{u.id}",
                "type": "user_joined",
                "title": f"{u.nickname}님이 가입했습니다",
                "timestamp": u.created_at,
                "data": {"user_id": u.id, "email": u.email}
            })

        for d in draws:
            activities.append({
                "id": f"draw_{d.id}",
                "type": "draw_saved",
                "title": f"추첨 결과 저장됨: {d.title}",
                "timestamp": d.created_at,
                "data": {"draw_id": d.id, "title": d.title}
            })

        activities.sort(key=lambda x: x["timestamp"] or datetime.min, reverse=True)
        return activities[skip: skip + limit]

notification_service = NotificationService()
