# app/services/auth_service.py
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import User, EmailVerification as EmailVerificationModel, Notification
from app.utils.auth import get_password_hash, verify_password, create_access_token
from app.utils.auth import set_auth_cookie, clear_auth_cookie
import random, string, os, jwt

# ===== 수동 검증 유틸 =====
def _validate_password_rules(pw: str):
    if not pw or len(pw) < 6 or len(pw) > 32:
        raise HTTPException(400, "비밀번호는 6-32자 사이여야 합니다.")
    import re
    pats = [r'[A-Z]', r'[a-z]', r'[0-9]', r'[!@#$%^&*(),.?\":{}|<>]']
    if sum(1 for p in pats if re.search(p, pw)) < 2:
        raise HTTPException(400, "비밀번호는 영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상 포함해야 합니다.")

def _validate_nickname_rules(nick: str):
    if not nick or len(nick) < 2 or len(nick) > 15:
        raise HTTPException(400, "닉네임은 2-15자 사이여야 합니다.")
    import re
    if not re.match(r'^[가-힣a-zA-Z0-9]+$', nick):
        raise HTTPException(400, "닉네임은 한글, 영문, 숫자만 사용 가능합니다.")

# ===== 회원가입 / 로그인 / 로그아웃 =====
async def register_service(request, db: Session):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    nickname = data.get("nickname")
    agree_terms = bool(data.get("agree_terms", False))
    agree_privacy = bool(data.get("agree_privacy", False))
    agree_collection = bool(data.get("agree_collection", False))
    agree_marketing = bool(data.get("agree_marketing", False))

    if not email or not password or not nickname:
        raise HTTPException(400, "이메일/비밀번호/닉네임은 필수입니다.")
    _validate_password_rules(password)
    _validate_nickname_rules(nickname)
    if not (agree_terms and agree_privacy and agree_collection):
        raise HTTPException(400, "필수 약관 동의가 필요합니다.")

    from app.services.user_service import get_user_by_email, get_user_by_nickname
    if get_user_by_email(db, email):
        raise HTTPException(409, "이미 등록된 이메일입니다.")
    blocked = db.query(User).filter(User.email == email, User.is_blocked == True).first()
    if blocked:
        raise HTTPException(403, "가입 불가능한 이메일입니다. 관리자에게 문의하세요.")
    if get_user_by_nickname(db, nickname):
        raise HTTPException(409, "이미 사용 중인 닉네임입니다.")

    hashed = get_password_hash(password)
    user = User(
        email=email, password_hash=hashed, nickname=nickname, role="member",
        is_active=True, is_email_verified=True,
        created_at=datetime.now(),
        agree_terms=agree_terms, agree_privacy=agree_privacy,
        agree_collection=agree_collection, agree_marketing=agree_marketing
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # ✅ 회원가입 알림(Notification) 생성
    try:
        notification = Notification(
            type="user_joined",
            title=f"{user.nickname}님이 가입했습니다",
            content=f"새로운 사용자가 가입했습니다. 이메일: {user.email}",
            related_id=user.id,
            created_at=datetime.now(),
        )
        db.add(notification)
        db.commit()
    except Exception as e:
        # 알림 생성 실패해도 회원가입은 유지
        print(f"[⚠️ 회원가입 알림 생성 실패] {str(e)}")

    return {"message": "회원가입이 완료되었습니다.", "user_id": user.id}


# ===== 로그인 (remember_me 옵션 추가) =====
async def login_service(request, response, db: Session):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    remember_me = data.get("remember_me", False)  # ✅ 추가

    if not email or not password:
        raise HTTPException(400, "이메일/비밀번호는 필수입니다.")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.")
    if not user.is_active:
        raise HTTPException(403, "비활성화된 계정입니다.")
    if user.is_blocked:
        msg = "차단된 계정입니다."
        if user.blocked_reason:
            msg += f" 사유: {user.blocked_reason}"
        raise HTTPException(403, msg)

    # ✅ remember_me 적용 (만료시간 결정)
    if remember_me:
        expires_delta = timedelta(days=30)
    else:
        from app.config import settings
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    token = create_access_token({"sub": str(user.id), "role": user.role}, expires_delta=expires_delta)

    # ✅ 쿠키 설정 시 만료시간 전달
    set_auth_cookie(response, token, expires_delta)

    return {
        "message": "로그인 성공",
        "remember_me": remember_me,
        "expires_in": expires_delta.total_seconds(),
        "user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "role": user.role
        }
    }


def logout_service(response):
    clear_auth_cookie(response)
    return {"message": "로그아웃 되었습니다."}

# ===== 이메일 인증 코드 발송/검증 =====
def _gen_code():
    return ''.join(random.choices(string.digits, k=6))

async def send_verification_code_service(request, db: Session):
    data = await request.json()
    email = data.get("email")
    if not email:
        raise HTTPException(400, "이메일은 필수입니다.")

    existing = db.query(User).filter(User.email == email, User.is_active == True, User.is_email_verified == True).first()
    if existing:
        raise HTTPException(409, "이미 가입된 이메일입니다.")

    code = _gen_code()
    ev = db.query(EmailVerificationModel).filter(EmailVerificationModel.email == email).first()
    expires = datetime.now() + timedelta(minutes=3)
    if ev:
        ev.verification_code = code; ev.expires_at = expires
    else:
        ev = EmailVerificationModel(email=email, verification_code=code, expires_at=expires)
        db.add(ev)
    db.commit()
    # 메일 발송 로직(별도 서비스)이 있으면 호출
    return {"message":"인증 코드가 발송되었습니다."}

async def verify_email_code_service(request, db: Session):
    data = await request.json()
    email = data.get("email"); code = data.get("code")
    if not email or not code:
        raise HTTPException(400, "이메일/코드는 필수입니다.")
    ev = db.query(EmailVerificationModel).filter(EmailVerificationModel.email == email).first()
    if not ev: raise HTTPException(404, "인증 정보를 찾을 수 없습니다.")
    if ev.verification_code != code: raise HTTPException(400, "인증 코드가 일치하지 않습니다.")
    if ev.expires_at < datetime.now(): raise HTTPException(400, "인증 코드가 만료되었습니다.")
    db.delete(ev); db.commit()
    return {"message":"이메일 인증이 완료되었습니다."}

async def check_email_duplicate_service(request, db: Session):
    """회원가입 전 이메일 중복 확인"""
    import re
    from app.services.user_service import (
        get_user_by_email,
        get_user_by_email_for_registration
    )

    data = await request.json()
    email = data.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="이메일이 필요합니다.")

    email_pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    if not re.match(email_pattern, email):
        raise HTTPException(status_code=400, detail="올바른 이메일 형식을 입력해주세요.")

    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

    deleted_user = get_user_by_email_for_registration(db, email)
    if deleted_user:
        raise HTTPException(status_code=409, detail="최근 탈퇴한 사용자입니다. 다른 이메일을 사용해주세요.")

    return {"message": "사용 가능한 이메일입니다."}

async def check_nickname_duplicate_service(request, db: Session):
    """닉네임 중복 확인"""
    import re
    from app.services.user_service import get_user_by_nickname_for_registration

    data = await request.json()
    nickname = data.get("nickname")

    if not nickname:
        raise HTTPException(status_code=400, detail="닉네임이 필요합니다.")

    # 닉네임 유효성 검사
    if len(nickname) < 2 or len(nickname) > 15:
        raise HTTPException(status_code=400, detail="닉네임은 2~15자 사이여야 합니다.")
    if not re.match(r"^[가-힣a-zA-Z0-9]+$", nickname):
        raise HTTPException(status_code=400, detail="닉네임은 한글, 영문, 숫자만 사용 가능합니다.")

    existing_user = get_user_by_nickname_for_registration(db, nickname)
    if existing_user:
        if existing_user.is_active and existing_user.deleted_at is None:
            raise HTTPException(status_code=409, detail="이미 사용 중인 닉네임입니다.")
        elif existing_user.deleted_at is not None:
            raise HTTPException(status_code=409, detail="최근 탈퇴한 사용자입니다. 다른 닉네임을 사용해주세요.")
        else:
            raise HTTPException(status_code=409, detail="현재 이 닉네임은 사용할 수 없습니다.")

    return {"message": "사용 가능한 닉네임입니다."}




# ===== 비밀번호 변경/재설정 =====
async def change_password_service(request, db: Session, current_user: User):
    data = await request.json()
    current = data.get("current_password")
    new = data.get("new_password")
    if not current or not new:
        raise HTTPException(400, "현재/새 비밀번호는 필수입니다.")
    if not verify_password(current, current_user.password_hash):
        raise HTTPException(401, "현재 비밀번호가 일치하지 않습니다.")
    _validate_password_rules(new)
    current_user.password_hash = get_password_hash(new)
    current_user.updated_at = datetime.now()
    db.commit(); db.refresh(current_user)
    return {"message":"비밀번호가 변경되었습니다."}

def generate_password_reset_token(email: str) -> str:
    payload = {'email': email, 'type': 'password_reset', 'exp': datetime.utcnow() + timedelta(minutes=30)}
    secret_key = os.getenv('JWT_SECRET_KEY','your-secret-key-change-in-production')
    return jwt.encode(payload, secret_key, algorithm='HS256')

def verify_password_reset_token(token: str) -> dict:
    secret_key = os.getenv('JWT_SECRET_KEY','your-secret-key-change-in-production')
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        if payload.get('type') != 'password_reset':
            raise HTTPException(400, "잘못된 토큰입니다.")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(400, "토큰이 만료되었습니다.")
    except jwt.InvalidTokenError:
        raise HTTPException(400, "잘못된 토큰입니다.")

async def password_reset_request_service(request, db: Session):
    data = await request.json()
    email = data.get("email")
    if not email:
        raise HTTPException(400, "이메일은 필수입니다.")
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        # 보안상 200 응답으로 위장해도 되지만, 여기선 명시적으로 처리
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    token = generate_password_reset_token(email)
    # 이메일 발송 로직(별도) 호출
    return {"message":"비밀번호 재설정 메일이 발송되었습니다.", "token_demo": token}  # 실제 운영에선 토큰 반환 X

async def password_reset_confirm_service(request, db: Session):
    data = await request.json()
    token = data.get("token"); new_password = data.get("new_password")
    if not token or not new_password:
        raise HTTPException(400, "토큰/새 비밀번호는 필수입니다.")
    _validate_password_rules(new_password)
    payload = verify_password_reset_token(token)
    email = payload["email"]
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")
    user.password_hash = get_password_hash(new_password)
    user.updated_at = datetime.now()
    db.commit(); db.refresh(user)
    return {"message":"비밀번호가 재설정되었습니다."}
