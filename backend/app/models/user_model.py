from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database.connection import Base

class User(Base):
    """사용자 모델 - 회원가입/로그인용"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), nullable=False, unique=True, comment="이메일")
    password_hash = Column(String(255), nullable=False, comment="비밀번호 해시")
    nickname = Column(String(15), nullable=False, unique=True, comment="닉네임")
    role = Column(String(20), nullable=False, default="member", comment="사용자 권한 (member/admin)")
    is_active = Column(Boolean, default=True, comment="활성 상태")
    is_email_verified = Column(Boolean, default=False, comment="이메일 인증 여부")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="가입일시")
    deleted_at = Column(DateTime(timezone=True), nullable=True, comment="탈퇴일시")
    nickname_deactivated_at = Column(DateTime(timezone=True), nullable=True, comment="닉네임 비활성화 일시")
    
    # 회원 차단 필드들
    is_blocked = Column(Boolean, default=False, comment="차단 여부")
    blocked_at = Column(DateTime(timezone=True), nullable=True, comment="차단 일시")
    blocked_reason = Column(String(500), nullable=True, comment="차단 사유")
    
    # 약관 동의 필드들
    agree_terms = Column(Boolean, default=False, comment="서비스 이용약관 동의")
    agree_privacy = Column(Boolean, default=False, comment="개인정보처리방침 동의")
    agree_collection = Column(Boolean, default=False, comment="개인정보수집 및 이용동의")
    agree_marketing = Column(Boolean, default=False, comment="마케팅정보 수집 및 이용 동의")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', nickname='{self.nickname}', role='{self.role}')>"


class TempUser(Base):
    """이메일 인증 대기 중인 임시 사용자"""
    __tablename__ = "temp_users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), nullable=False, unique=True, comment="이메일")
    password_hash = Column(String(255), nullable=False, comment="비밀번호 해시")
    nickname = Column(String(15), nullable=False, unique=True, comment="닉네임")
    verification_token = Column(String(255), nullable=False, unique=True, comment="이메일 인증 토큰")
    expires_at = Column(DateTime(timezone=True), nullable=False, comment="토큰 만료 시간")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성 시각")
    agree_terms = Column(Boolean, default=False, comment="서비스 이용약관 동의")
    agree_privacy = Column(Boolean, default=False, comment="개인정보처리방침 동의")
    agree_collection = Column(Boolean, default=False, comment="개인정보수집 및 이용 동의")
    agree_marketing = Column(Boolean, default=False, comment="마케팅정보 수집 및 이용 동의")

    def __repr__(self):
        return f"<TempUser(id={self.id}, email='{self.email}', nickname='{self.nickname}')>"