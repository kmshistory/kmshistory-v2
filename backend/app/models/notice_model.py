from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class NoticeCategory(Base):
    __tablename__ = "notice_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True, comment="카테고리명")
    order = Column(Integer, nullable=False, default=0, comment="정렬 순서")
    is_active = Column(Boolean, default=True, comment="활성 여부")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정일시")
    notices = relationship("Notice", back_populates="category")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False, comment="작성자 ID")
    category_id = Column(Integer, ForeignKey('notice_categories.id'), comment="카테고리 ID")
    title = Column(String(200), nullable=False, comment="제목")
    content = Column(Text, nullable=False, comment="내용")
    publish_status = Column(String(20), nullable=False, default="published", comment="발행 상태 (published/scheduled/private)")
    published_at = Column(DateTime(timezone=True), nullable=True, comment="발행일시")
    first_published_at = Column(DateTime(timezone=True), nullable=True, comment="최초 발행일시")
    views = Column(Integer, default=0, comment="조회수")
    is_deleted = Column(Boolean, default=False, comment="삭제 여부")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정일시")
    deleted_at = Column(DateTime(timezone=True), nullable=True, comment="삭제일시")

    category = relationship("NoticeCategory", back_populates="notices")
