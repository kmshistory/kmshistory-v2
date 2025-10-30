from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re
from app.schemas.common import PageResponse

class UserCreate(BaseModel):
    """회원가입 스키마"""
    email: EmailStr
    password: str
    nickname: str
    agree_terms: bool = False
    agree_privacy: bool = False
    agree_collection: bool = False
    agree_marketing: bool = False
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6 or len(v) > 32:
            raise ValueError('비밀번호는 6-32자 사이여야 합니다.')
        
        # 영문대문자, 소문자, 숫자, 특수문자 중 최소 2가지 이상
        patterns = [
            r'[A-Z]',  # 대문자
            r'[a-z]',  # 소문자
            r'[0-9]',  # 숫자
            r'[!@#$%^&*(),.?":{}|<>]'  # 특수문자
        ]
        
        match_count = sum(1 for pattern in patterns if re.search(pattern, v))
        if match_count < 2:
            raise ValueError('비밀번호는 영문대·소문자, 숫자, 특수문자 중 최소 2가지 이상을 포함해야 합니다.')
        
        return v
    
    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v):
        if len(v) < 2 or len(v) > 15:
            raise ValueError('닉네임은 2-15자 사이여야 합니다.')
        
        # 한글, 영문, 숫자만 허용
        if not re.match(r'^[가-힣a-zA-Z0-9]+$', v):
            raise ValueError('닉네임은 한글, 영문, 숫자만 사용 가능합니다.')
        
        return v

class UserLogin(BaseModel):
    """로그인 스키마"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """사용자 정보 응답 스키마"""
    id: int
    email: str
    nickname: str
    role: str
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    """사용자 정보 수정 스키마"""
    nickname: Optional[str] = None
    password: Optional[str] = None
    
    @field_validator('nickname')
    @classmethod
    def validate_nickname(cls, v):
        if v is not None:
            if len(v) < 2 or len(v) > 15:
                raise ValueError('닉네임은 2-15자 사이여야 합니다.')
            
            if not re.match(r'^[가-힣a-zA-Z0-9]+$', v):
                raise ValueError('닉네임은 한글, 영문, 숫자만 사용 가능합니다.')
        
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if v is not None:
            if len(v) < 6 or len(v) > 32:
                raise ValueError('비밀번호는 6-32자 사이여야 합니다.')
            
            patterns = [
                r'[A-Z]',  # 대문자
                r'[a-z]',  # 소문자
                r'[0-9]',  # 숫자
                r'[!@#$%^&*(),.?":{}|<>]'  # 특수문자
            ]
            
            match_count = sum(1 for pattern in patterns if re.search(pattern, v))
            if match_count < 2:
                raise ValueError('비밀번호는 영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상을 포함해야 합니다.')
        
        return v

class EmailVerification(BaseModel):
    """이메일 인증 스키마"""
    email: EmailStr
    code: str

class PasswordChange(BaseModel):
    """비밀번호 변경 스키마"""
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 6 or len(v) > 32:
            raise ValueError('비밀번호는 6-32자 사이여야 합니다.')
        
        patterns = [
            r'[A-Z]',  # 대문자
            r'[a-z]',  # 소문자
            r'[0-9]',  # 숫자
            r'[!@#$%^&*(),.?":{}|<>]'  # 특수문자
        ]
        
        match_count = sum(1 for pattern in patterns if re.search(pattern, v))
        if match_count < 2:
            raise ValueError('비밀번호는 영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상을 포함해야 합니다.')
        
        return v

    class UserPageResponse(PageResponse[UserResponse]):
        pass