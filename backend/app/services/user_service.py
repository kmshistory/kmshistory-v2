# app/services/user_service.py
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from fastapi import HTTPException
from datetime import datetime, timedelta
import re
from app.models import User
from app.schemas import PageResponse

# =========================
# 조회 유틸 (회원가입/검증 재사용)
# =========================

def get_user_by_email(db: Session, email: str):
    seven_days_ago = datetime.now() - timedelta(days=7)
    return db.query(User).filter(
        User.email == email,
        (User.deleted_at.is_(None)) | (User.deleted_at < seven_days_ago)
    ).first()

def get_user_by_nickname(db: Session, nickname: str):
    seven_days_ago = datetime.now() - timedelta(days=7)
    return db.query(User).filter(
        User.nickname == nickname,
        (User.nickname_deactivated_at.is_(None)) | (User.nickname_deactivated_at < seven_days_ago)
    ).first()

# --- NEW: 회원가입/관리자 생성 시 중복검사 전용 유틸 (최근 7일 내 탈퇴 포함) ---
def get_user_by_email_for_registration(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_nickname_for_registration(db: Session, nickname: str):
    return db.query(User).filter(User.nickname == nickname).first()

# =========================
# 관리자 목록/상세/수정/삭제
# =========================

# --- UPDATED: 필터 확장 (q, role, is_active, status) + 페이지 응답 ---
def list_users_admin(
    db: Session,
    page: int,
    limit: int,
    q: str | None = None,
    role: str | None = None,
    is_active: str | None = None,
    status: str | None = None
):
    query = db.query(User).filter(User.deleted_at.is_(None))  # 백오피스 기본: 삭제 숨김

    if q:
        query = query.filter(or_(User.email.contains(q), User.nickname.contains(q)))

    if role:
        query = query.filter(User.role == role)

    if is_active is not None:
        # "true"/"false" 문자열로 들어오는 경우 처리
        want_active = is_active.lower() == "true"
        query = query.filter(User.is_active == want_active)

    if status:
        if status == "active":
            query = query.filter(User.is_blocked == False)
        elif status == "blocked":
            query = query.filter(User.is_blocked == True)

    total = query.count()
    items = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return PageResponse.create(items=items, total=total, page=page, limit=limit)

# --- NEW: 총 카운트 전용 ---
def count_users_admin(
    db: Session,
    q: str | None = None,
    role: str | None = None,
    is_active: str | None = None,
    status: str | None = None
):
    query = db.query(User).filter(User.deleted_at.is_(None))

    if q:
        query = query.filter(or_(User.email.contains(q), User.nickname.contains(q)))
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        want_active = is_active.lower() == "true"
        query = query.filter(User.is_active == want_active)
    if status:
        if status == "active":
            query = query.filter(User.is_blocked == False)
        elif status == "blocked":
            query = query.filter(User.is_blocked == True)

    return query.count()

def get_user_admin(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    return user

# --- UPDATED: 닉네임 검증/중복체크 강화 ---
def update_user_admin(db: Session, user_id: int, data: dict):
    user = get_user_admin(db, user_id)

    nick = data.get("nickname")
    if nick is not None:
        if len(nick) < 2 or len(nick) > 15 or not re.match(r'^[가-힣a-zA-Z0-9]+$', nick):
            raise HTTPException(400, "닉네임은 2-15자, 한글/영문/숫자만 가능")
        exists = db.query(User).filter(User.nickname == nick, User.id != user_id).first()
        if exists:
            raise HTTPException(409, "이미 사용 중인 닉네임입니다.")
        user.nickname = nick

    if "is_active" in data:
        user.is_active = bool(data["is_active"])

    if "role" in data and data["role"]:
        # 관리자 계정의 역할을 여기서 바꾸고 싶다면 정책 확인 필요
        user.role = data["role"]

    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)
    return user

def soft_delete_user_admin(db: Session, user_id: int):
    user = get_user_admin(db, user_id)
    user.is_active = False
    user.deleted_at = datetime.now()
    db.commit()
    db.refresh(user)
    return {"message": "사용자가 삭제(비활성화)되었습니다."}

# --- UPDATED: block/unblock에 blocked_at/blocked_reason 일관처리 ---
def block_user_admin(db: Session, user_id: int, reason: str | None):
    user = get_user_admin(db, user_id)
    user.is_blocked = True
    user.blocked_at = func.now()  # 모델에 blocked_at 필드가 있다고 가정(이미 라우터에서 사용)
    user.blocked_reason = reason
    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)
    return {"message": "사용자가 차단되었습니다."}

def unblock_user_admin(db: Session, user_id: int):
    user = get_user_admin(db, user_id)
    user.is_blocked = False
    user.blocked_at = None
    user.blocked_reason = None
    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)
    return {"message": "사용자 차단이 해제되었습니다."}

# =========================
# 관리자 고급 기능 (NEW)
# =========================

# --- NEW: 관리자 직접 사용자 생성 ---
def create_user_admin(db: Session, data: dict):
    email = (data.get("email") or "").strip()
    nickname = (data.get("nickname") or "").strip()
    password = (data.get("password") or "").strip()
    role = data.get("role") or "member"

    if not email or not nickname or not password:
        raise HTTPException(400, "이메일, 닉네임, 비밀번호는 필수입니다.")

    # 이메일 형식
    email_pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    if not re.match(email_pattern, email):
        raise HTTPException(400, "올바른 이메일 형식을 입력해주세요.")

    # 닉네임 형식
    if len(nickname) < 2 or len(nickname) > 15 or not re.match(r'^[가-힣a-zA-Z0-9]+$', nickname):
        raise HTTPException(400, "닉네임은 2-15자, 한글/영문/숫자만 가능합니다.")

    # 비밀번호 규칙: 6~32자 & 2종류 이상
    if len(password) < 6 or len(password) > 32:
        raise HTTPException(400, "비밀번호는 6-32자 사이여야 합니다.")
    pats = [r'[A-Z]', r'[a-z]', r'[0-9]', r'[!@#$%^&*(),.?\":{}|<>]']
    if sum(1 for p in pats if re.search(p, password)) < 2:
        raise HTTPException(400, "비밀번호는 영문 대/소문자, 숫자, 특수문자 중 2가지 이상 포함해야 합니다.")

    # 이메일/닉네임 중복
    if get_user_by_email_for_registration(db, email):
        raise HTTPException(409, "이미 사용 중인 이메일입니다.")
    if get_user_by_nickname_for_registration(db, nickname):
        raise HTTPException(409, "이미 사용 중인 닉네임입니다.")

    # 해시
    from app.utils import get_password_hash
    hashed = get_password_hash(password)

    user = User(
        email=email,
        nickname=nickname,
        role=role,
        is_active=True,
        is_email_verified=True,  # 관리자 생성은 인증 패스
        password_hash=hashed,
        agree_terms=True,
        agree_privacy=True,
        agree_collection=True,
        agree_marketing=True,
        created_at=datetime.now()
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "사용자가 생성되었습니다.", "user_id": user.id}

# --- NEW: 계정 재활성화 ---
def activate_user_admin(db: Session, user_id: int):
    user = get_user_admin(db, user_id)
    user.is_active = True
    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)
    return {"message": "사용자가 활성화되었습니다."}

# --- NEW: 영구 삭제 ---
def delete_user_permanent_admin(db: Session, user_id: int, acting_admin_id: int | None = None):
    user = get_user_admin(db, user_id)

    # 자기 자신/관리자 삭제 보호
    if acting_admin_id is not None and user.id == acting_admin_id:
        raise HTTPException(400, "본인 계정은 삭제할 수 없습니다.")
    if user.role == "admin":
        raise HTTPException(400, "관리자 계정은 삭제할 수 없습니다.")

    db.delete(user)
    db.commit()
    return {"message": "사용자가 영구 삭제되었습니다."}

# --- NEW: 역할 변경 ---
def change_user_role_admin(db: Session, user_id: int, new_role: str):
    if new_role not in {"admin", "leader", "member"}:
        raise HTTPException(400, "유효하지 않은 역할입니다.")

    user = get_user_admin(db, user_id)
    user.role = new_role
    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)
    return {"message": "사용자 역할이 변경되었습니다."}
