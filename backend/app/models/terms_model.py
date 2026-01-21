from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Terms(Base):
    """약관 모델"""
    __tablename__ = "terms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String(50), nullable=False, unique=True, index=True, comment="약관 식별 키 (terms, privacy, collection, marketing)")
    title = Column(String(100), nullable=False, comment="약관 제목")
    content = Column(String(10000), nullable=False, comment="약관 내용")
    is_active = Column(Boolean, default=True, comment="활성 상태")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정일시")

    def __repr__(self):
        return f"<Terms(id={self.id}, key='{self.key}', title='{self.title}', is_active={self.is_active})>"
