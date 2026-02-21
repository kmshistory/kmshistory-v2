# app/services/auth_service.py
from fastapi import HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.models import User, TempUser, Notification
from app.utils.auth import get_password_hash, verify_password, create_access_token
from app.utils.auth import set_auth_cookie, clear_auth_cookie
import jwt, secrets
from app.services.email_service import (
    send_password_reset_email,
    send_signup_confirmation_email,
    send_welcome_email,
)
from app.config import settings

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
    email = (data.get("email") or "").strip()
    password = data.get("password")
    nickname = (data.get("nickname") or "").strip()
    # camelCase와 snake_case 둘 다 지원
    agree_terms = bool(data.get("agree_terms") or data.get("agreeTerms", False))
    agree_privacy = bool(data.get("agree_privacy") or data.get("agreePrivacy", False))
    agree_collection = bool(data.get("agree_collection") or data.get("agreeCollection", False))
    agree_marketing = bool(data.get("agree_marketing") or data.get("agreeMarketing", False))

    if not email or not password or not nickname:
        raise HTTPException(400, "이메일/비밀번호/닉네임은 필수입니다.")
    _validate_password_rules(password)
    _validate_nickname_rules(nickname)
    if not (agree_terms and agree_privacy and agree_collection):
        raise HTTPException(400, "필수 약관 동의가 필요합니다.")

    from app.services.user_service import (
        get_user_by_email,
        get_user_by_nickname,
        get_user_by_email_for_registration,
        get_user_by_nickname_for_registration,
    )

    # 이미 가입된 사용자/차단 사용자 확인
    if get_user_by_email(db, email) or get_user_by_email_for_registration(db, email):
        raise HTTPException(409, "이미 등록된 이메일입니다.")
    blocked = db.query(User).filter(User.email == email, User.is_blocked == True).first()
    if blocked:
        raise HTTPException(403, "가입 불가능한 이메일입니다. 관리자에게 문의하세요.")
    if get_user_by_nickname(db, nickname) or get_user_by_nickname_for_registration(db, nickname):
        raise HTTPException(409, "이미 사용 중인 닉네임입니다.")

    hashed = get_password_hash(password)
    token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    expire_minutes = max(int(getattr(settings, "EMAIL_VERIFICATION_EXPIRE_MINUTES", 60 * 24)), 1)
    expires_at = now + timedelta(minutes=expire_minutes)

    temp_user = db.query(TempUser).filter(TempUser.email == email).first()

    # 별도 닉네임 중복 체크 (다른 이메일이 동일 닉네임으로 대기중인 경우)
    nickname_conflict = (
        db.query(TempUser)
        .filter(
            TempUser.nickname == nickname,
            TempUser.email != email,
            TempUser.expires_at > now,
        )
        .first()
    )
    if nickname_conflict:
        raise HTTPException(409, "이미 사용 중인 닉네임입니다.")

    if temp_user:
        temp_user.password_hash = hashed
        temp_user.nickname = nickname
        temp_user.verification_token = token
        temp_user.expires_at = expires_at
        temp_user.agree_terms = agree_terms
        temp_user.agree_privacy = agree_privacy
        temp_user.agree_collection = agree_collection
        temp_user.agree_marketing = agree_marketing
    else:
        temp_user = TempUser(
            email=email,
            password_hash=hashed,
            nickname=nickname,
            verification_token=token,
            expires_at=expires_at,
            agree_terms=agree_terms,
            agree_privacy=agree_privacy,
            agree_collection=agree_collection,
            agree_marketing=agree_marketing,
        )
        db.add(temp_user)

    db.commit()

    signup_link = f"{settings.FRONTEND_URL.rstrip('/')}/register/confirm?token={token}"

    try:
        await send_signup_confirmation_email(email, nickname, signup_link, expires_at)
    except Exception as e:
        # 이메일 발송 실패 시, 사용자가 재시도할 수 있도록 에러 반환
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"인증 이메일 발송 중 오류가 발생했습니다: {str(e)}",
        )

    return {
        "message": "입력하신 이메일 주소로 인증 링크를 보냈습니다. 메일을 확인하여 가입을 완료해주세요."
    }


async def verify_signup_token_service(token: str, db: Session):
    if not token:
        raise HTTPException(400, "토큰이 필요합니다.")

    temp_user = db.query(TempUser).filter(TempUser.verification_token == token).first()
    if not temp_user:
        raise HTTPException(400, "토큰이 만료되었거나 유효하지 않습니다. 다시 회원가입을 진행해주세요.")

    now = datetime.now(timezone.utc)
    if temp_user.expires_at < now:
        db.delete(temp_user)
        db.commit()
        raise HTTPException(400, "토큰이 만료되었습니다. 다시 회원가입을 진행해주세요.")

    from app.services.user_service import (
        get_user_by_email_for_registration,
        get_user_by_nickname_for_registration,
    )

    if get_user_by_email_for_registration(db, temp_user.email):
        db.delete(temp_user)
        db.commit()
        raise HTTPException(409, "이미 등록된 이메일입니다.")

    if get_user_by_nickname_for_registration(db, temp_user.nickname):
        db.delete(temp_user)
        db.commit()
        raise HTTPException(409, "이미 사용 중인 닉네임입니다.")

    user = User(
        email=temp_user.email,
        password_hash=temp_user.password_hash,
        nickname=temp_user.nickname,
        role="member",
        is_active=True,
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
        agree_terms=temp_user.agree_terms,
        agree_privacy=temp_user.agree_privacy,
        agree_collection=temp_user.agree_collection,
        agree_marketing=temp_user.agree_marketing,
    )

    db.add(user)
    db.flush()

    notification = Notification(
        type="user_joined",
        title=f"{user.nickname}님이 가입했습니다",
        content=f"새로운 사용자가 가입했습니다. 이메일: {user.email}",
        related_id=user.id,
        created_at=datetime.now(),
    )

    db.add(notification)
    db.delete(temp_user)
    db.commit()
    db.refresh(user)

    try:
        await send_welcome_email(user.email, user.nickname)
    except Exception as e:
        print(f"[⚠️ 환영 이메일 발송 실패] {str(e)}")

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


def _make_unique_nickname(db: Session, base_nickname: str) -> str:
    """닉네임이 이미 있으면 숫자 접미사로 유일하게 만든다."""
    import re
    # 한글/영문/숫자만 2~15자로 자르기
    raw = re.sub(r"[^\w가-힣]", "", base_nickname or "user")[:15]
    if len(raw) < 2:
        raw = "user"
    nickname = raw
    suffix = 0
    while db.query(User).filter(User.nickname == nickname).first() is not None:
        suffix += 1
        nickname = f"{raw}{suffix}"[:15]
    return nickname


def google_login_or_register_service(
    userinfo: dict, response, db: Session, agreement: dict | None = None
) -> "User":
    """
    구글 userinfo로 로그인 또는 자동 가입 후 JWT 쿠키 설정.
    userinfo: {"email": str, "name": str, "picture": str | None}
    agreement: {"agree_terms", "agree_privacy", "agree_collection", "agree_marketing"} (신규 가입 시 필수)
    """
    email = (userinfo.get("email") or "").strip()
    name = (userinfo.get("name") or email or "사용자").strip()
    if not email:
        raise HTTPException(status_code=400, detail="이메일 정보를 가져올 수 없습니다.")

    user = db.query(User).filter(User.email == email).first()
    if user:
        if not user.is_active:
            raise HTTPException(403, "비활성화된 계정입니다.")
        if user.is_blocked:
            raise HTTPException(403, "차단된 계정입니다. 관리자에게 문의하세요.")
    else:
        # 신규 가입: 약관 동의 반영, 닉네임 생성
        ag = agreement or {}
        agree_terms = ag.get("agree_terms", True)
        agree_privacy = ag.get("agree_privacy", True)
        agree_collection = ag.get("agree_collection", True)
        agree_marketing = ag.get("agree_marketing", False)

        nickname = _make_unique_nickname(db, name)
        placeholder_hash = get_password_hash(secrets.token_urlsafe(32))
        user = User(
            email=email,
            password_hash=placeholder_hash,
            nickname=nickname,
            role="member",
            is_active=True,
            is_email_verified=True,
            created_at=datetime.now(timezone.utc),
            agree_terms=agree_terms,
            agree_privacy=agree_privacy,
            agree_collection=agree_collection,
            agree_marketing=agree_marketing,
        )
        db.add(user)
        db.flush()
        notif = Notification(
            type="user_joined",
            title=f"{user.nickname}님이 가입했습니다",
            content=f"Google 로그인으로 가입했습니다. 이메일: {user.email}",
            related_id=user.id,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notif)
        db.commit()
        db.refresh(user)

    expires_delta = timedelta(days=30)
    token = create_access_token({"sub": str(user.id), "role": user.role}, expires_delta)
    set_auth_cookie(response, token, expires_delta)
    return user


def google_complete_signup_service(
    pending_token: str,
    agreement: dict,
    response,
    db: Session,
) -> "User":
    """pending_signup 토큰 검증 후 약관 동의와 함께 신규 가입 완료 및 로그인."""
    from app.utils.auth import verify_pending_signup_token

    userinfo = verify_pending_signup_token(pending_token)
    return google_login_or_register_service(userinfo, response, db, agreement=agreement)


async def check_email_duplicate_service(request, db: Session):
    """회원가입 전 이메일 중복 확인"""
    import re
    from app.services.user_service import (
        get_user_by_email,
        get_user_by_email_for_registration
    )

    try:
        data = await request.json()
        email = data.get("email")

        if not email:
            raise HTTPException(status_code=400, detail="이메일이 필요합니다.")

        email_pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
        if not re.match(email_pattern, email):
            raise HTTPException(status_code=400, detail="올바른 이메일 형식을 입력해주세요.")

        # 데이터베이스 쿼리 실행 (타임아웃 방지를 위해 빠르게 처리)
        print(f"[DEBUG] 이메일 중복확인 시작: {email}")
        existing_user = get_user_by_email(db, email)
        print(f"[DEBUG] existing_user 조회 완료: {existing_user is not None}")
        
        if existing_user:
            raise HTTPException(status_code=409, detail="이미 사용 중인 이메일입니다.")

        now = datetime.now(timezone.utc)
        temp_user = (
            db.query(TempUser)
            .filter(TempUser.email == email, TempUser.expires_at > now)
            .first()
        )
        print(f"[DEBUG] temp_user 조회 완료: {temp_user is not None}")

        if temp_user:
            raise HTTPException(
                status_code=409,
                detail="이미 가입 진행 중인 이메일입니다. 이메일을 확인해주세요.",
            )

        deleted_user = get_user_by_email_for_registration(db, email)
        print(f"[DEBUG] deleted_user 조회 완료: {deleted_user is not None}")
        
        if deleted_user:
            raise HTTPException(status_code=409, detail="최근 탈퇴한 사용자입니다. 다른 이메일을 사용해주세요.")

        print(f"[DEBUG] 이메일 중복확인 완료: {email} - 사용 가능")
        return {"message": "사용 가능한 이메일입니다."}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] check_email_duplicate_service 에러: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"이메일 중복확인 중 오류가 발생했습니다: {str(e)}")

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

    now = datetime.now(timezone.utc)
    temp_user = (
        db.query(TempUser)
        .filter(TempUser.nickname == nickname, TempUser.expires_at > now)
        .first()
    )
    if temp_user:
        raise HTTPException(status_code=409, detail="이미 사용 중인 닉네임입니다.")

    return {"message": "사용 가능한 닉네임입니다."}




# ===== 비밀번호 변경 =====
async def change_password_service(request, db: Session, current_user: User):
    """로그인 중 사용자의 비밀번호 변경"""
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
    db.commit()
    db.refresh(current_user)

    return {"message": "비밀번호가 변경되었습니다."}


# ===== 비밀번호 재설정 토큰 생성/검증 =====
def generate_password_reset_token(email: str) -> str:
    """JWT 기반 비밀번호 재설정 토큰 생성"""
    payload = {
        "email": email,
        "type": "password_reset",
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }
    secret_key = settings.SECRET_KEY
    return jwt.encode(payload, secret_key, algorithm="HS256")


def verify_password_reset_token(token: str) -> dict:
    """비밀번호 재설정 토큰 검증"""
    secret_key = settings.SECRET_KEY
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        if payload.get("type") != "password_reset":
            raise HTTPException(400, "잘못된 토큰입니다.")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(400, "토큰이 만료되었습니다.")
    except jwt.InvalidTokenError:
        raise HTTPException(400, "잘못된 토큰입니다.")


# ===== 비밀번호 재설정 요청 =====
async def password_reset_request_service(request: Request, db: Session):
    """비밀번호 재설정 메일 발송"""
    data = await request.json()
    email = data.get("email")

    if not email:
        raise HTTPException(400, "이메일은 필수입니다.")

    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")

    # ✅ 토큰 생성
    token = generate_password_reset_token(email)

    # ✅ 프론트엔드 비밀번호 재설정 페이지 링크 구성
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    # ✅ 이메일 발송 (HTML 템플릿 포함)
    try:
        await send_password_reset_email(email, reset_link)
    except Exception as e:
        raise HTTPException(500, f"이메일 발송 중 오류 발생: {str(e)}")

    return {"message": "비밀번호 재설정 이메일이 발송되었습니다."}


# ===== 비밀번호 재설정 완료 =====
async def password_reset_confirm_service(request: Request, db: Session):
    """토큰 검증 후 새 비밀번호로 변경"""
    data = await request.json()
    token = data.get("token")
    new_password = data.get("new_password")

    if not token or not new_password:
        raise HTTPException(400, "토큰/새 비밀번호는 필수입니다.")

    _validate_password_rules(new_password)

    payload = verify_password_reset_token(token)
    email = payload["email"]

    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(404, "사용자를 찾을 수 없습니다.")

    # 새 비밀번호 저장
    user.password_hash = get_password_hash(new_password)
    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)

    return {"message": "비밀번호가 재설정되었습니다."}