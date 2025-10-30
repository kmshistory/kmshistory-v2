# app/services/mypage_service.py
from fastapi import HTTPException, Response
from sqlalchemy.orm import Session
from app.utils.auth import verify_password, get_password_hash, clear_auth_cookie
from datetime import datetime
import re

# 닉네임 수정
async def update_user_info_service(request, db: Session, current_user):
    data = await request.json()
    nickname = data.get("nickname")

    if not nickname:
        raise HTTPException(400, "닉네임이 필요합니다.")
    if len(nickname) < 2 or len(nickname) > 15:
        raise HTTPException(400, "닉네임은 2~15자 사이여야 합니다.")
    if not re.match(r"^[가-힣a-zA-Z0-9]+$", nickname):
        raise HTTPException(400, "닉네임은 한글, 영문, 숫자만 가능합니다.")

    existing = db.query(current_user.__class__).filter(
        current_user.__class__.nickname == nickname,
        current_user.__class__.id != current_user.id
    ).first()
    if existing:
        raise HTTPException(409, "이미 사용 중인 닉네임입니다.")

    current_user.nickname = nickname
    current_user.updated_at = datetime.now()
    db.commit()
    db.refresh(current_user)
    return {"message": "닉네임이 수정되었습니다."}

# 현재 비밀번호 확인
async def verify_current_password_service(request, db: Session, current_user):
    data = await request.json()
    current_password = data.get("current_password")
    if not current_password:
        raise HTTPException(400, "현재 비밀번호를 입력해주세요.")

    if verify_password(current_password, current_user.password_hash):
        return {"valid": True}
    else:
        raise HTTPException(400, "현재 비밀번호가 일치하지 않습니다.")

# 비밀번호 변경 (자동 로그아웃 포함)
async def change_user_password_service(request, db: Session, current_user):
    data = await request.json()
    current_pw = data.get("current_password")
    new_pw = data.get("new_password")

    if not current_pw or not new_pw:
        raise HTTPException(400, "현재/새 비밀번호를 입력해주세요.")

    if len(new_pw) < 6 or len(new_pw) > 32:
        raise HTTPException(400, "비밀번호는 6~32자 사이여야 합니다.")

    patterns = [r"[A-Z]", r"[a-z]", r"[0-9]", r'[!@#$%^&*(),.?":{}|<>]']
    match_count = sum(1 for p in patterns if re.search(p, new_pw))
    if match_count < 2:
        raise HTTPException(400, "비밀번호는 영문 대·소문자, 숫자, 특수문자 중 2가지 이상 포함해야 합니다.")

    if not verify_password(current_pw, current_user.password_hash):
        raise HTTPException(400, "현재 비밀번호가 일치하지 않습니다.")
    if current_pw == new_pw:
        raise HTTPException(400, "현재 비밀번호와 새 비밀번호가 같습니다.")

    # 비밀번호 업데이트
    current_user.password_hash = get_password_hash(new_pw)
    current_user.updated_at = datetime.now()
    db.commit()
    db.refresh(current_user)

    # 자동 로그아웃 처리
    response = Response()
    clear_auth_cookie(response)

    return {
        "message": "비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.",
        "logout": True,
        "headers": dict(response.headers)
    }

# 회원탈퇴 (자동 로그아웃 추가)
async def withdraw_user_service(request, db: Session, current_user):
    if current_user.deleted_at is not None:
        raise HTTPException(400, "이미 탈퇴 처리된 계정입니다.")

    # 계정 상태 변경
    current_user.deleted_at = datetime.now()
    current_user.is_active = False
    current_user.nickname_deactivated_at = datetime.now()
    db.commit()
    db.refresh(current_user)

    # 로그아웃 처리
    response = Response()
    clear_auth_cookie(response)

    return {
        "message": "회원탈퇴가 완료되었습니다. 7일 후 계정이 완전히 삭제됩니다.",
        "logout": True,
        "headers": dict(response.headers),
    }
