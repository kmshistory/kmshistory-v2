from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Notification(Base):
    """알림 모델"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(String(50), nullable=False, comment="알림 타입 (user_joined, draw_saved)")
    title = Column(String(200), nullable=False, comment="알림 제목")
    content = Column(Text, nullable=True, comment="알림 내용")
    is_read = Column(Boolean, default=False, comment="읽음 여부")
    related_id = Column(Integer, nullable=True, comment="관련 ID (사용자 ID 또는 추첨 기록 ID)")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")

    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.type}', title='{self.title}', is_read={self.is_read})>"
