from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.config import settings

# 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 토큰 보안
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """비밀번호 해싱"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """JWT 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """JWT 토큰 검증"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인 시간이 만료되었습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_from_cookie(request: Request, db: Session = Depends(get_db)) -> User:
    """쿠키에서 현재 사용자 조회"""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인 시간이 만료되었습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="비활성화된 사용자입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> User | None:
    """
    쿠키에서 현재 사용자 조회 (선택적)
    - 인증쿠키가 없거나 만료된 경우 None 반환
    - 그 외 오류는 그대로 전파
    """
    try:
        return get_current_user_from_cookie(request, db)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            return None
        raise


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    """현재 사용자 조회"""
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰에서 사용자 정보를 찾을 수 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="비활성화된 사용자입니다",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def get_admin_user(current_user: User = Depends(get_current_user_from_cookie)) -> User:
    """관리자 권한 확인"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )
    return current_user

# =========================================================
# ✅ 쿠키 설정 / 삭제 유틸 (login_service / logout_service용)
# =========================================================

def set_auth_cookie(response, token: str, expires_delta=None):
    """
    HttpOnly 쿠키에 JWT 토큰 저장
    """
    max_age = int(expires_delta.total_seconds()) if expires_delta else 60 * 60 * 24  # 기본 1일

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=max_age,
        path="/"
    )


def clear_auth_cookie(response):
    """
    JWT 쿠키 삭제 (로그아웃 시)
    - path="/" : 모든 경로에서 쿠키 삭제
    - httponly=True : 자바스크립트 접근 차단 (보안 강화)
    - secure=True : HTTPS에서만 전송
    - samesite="lax" : CSRF 공격 방어
    """
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=True,
        samesite="lax"
    )

