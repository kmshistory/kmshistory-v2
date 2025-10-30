from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Participant(Base):
    """대상자 모델 - 이름, 이메일, 상세 정보"""
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="이름")
    email = Column(String(100), nullable=False, comment="이메일")
    description = Column(String(500), nullable=True, comment="상세")
    upload_file_id = Column(Integer, ForeignKey('upload_files.id'), nullable=True, comment="업로드 파일 ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정일시")

    # 관계 설정
    upload_file = relationship("UploadedFile", backref="participants")

    def __repr__(self):
        return f"<Participant(id={self.id}, name='{self.name}', email='{self.email}', description='{self.description}')>"


class DrawParticipant(Base):
    """추첨 대상자 모델"""
    __tablename__ = "draw_participants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    draw_record_id = Column(Integer, ForeignKey('draw_records.id'), nullable=False, comment="추첨 기록 ID")
    participant_number = Column(Integer, nullable=False, comment="대상자 넘버 (순서구분용)")
    name = Column(String(100), nullable=False, comment="이름")
    email = Column(String(100), nullable=False, comment="이메일")
    description = Column(String(500), nullable=True, comment="상세")
    is_winner = Column(Boolean, default=False, comment="당첨자 여부")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")

    # 관계 설정
    draw_record = relationship("DrawRecord", back_populates="participants")

    def __repr__(self):
        return f"<DrawParticipant(id={self.id}, name='{self.name}', email='{self.email}', is_winner={self.is_winner})>"

class DrawRecord(Base):
    """추첨 기록 모델"""
    __tablename__ = "draw_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False, comment="추첨 제목")
    content = Column(Text, nullable=True, comment="추첨 내용")
    draw_datetime = Column(DateTime(timezone=True), nullable=False, comment="추첨일시")
    total_participants = Column(Integer, nullable=False, comment="대상자 수 (전체)")
    winner_count = Column(Integer, nullable=False, comment="당첨자 수")
    upload_file_id = Column(Integer, ForeignKey('upload_files.id'), nullable=True, comment="업로드 파일 ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정일시")

    # 관계 설정
    upload_file = relationship("UploadedFile", backref="draw_records")
    participants = relationship("DrawParticipant", back_populates="draw_record", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DrawRecord(id={self.id}, title='{self.title}', draw_datetime='{self.draw_datetime}')>"
