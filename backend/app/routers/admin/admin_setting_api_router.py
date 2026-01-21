from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services.admin_setting_service import admin_settings_service
from app.utils.auth import verify_password, get_password_hash
from sqlalchemy import func

router = APIRouter(prefix="/api/admin", tags=["Admin:Settings"])

# 공통 인증 함수
def require_admin(request: Request, db: Session):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    return user


# ✅ 관리자 정보 조회
@router.get("/me")
async def get_admin_info(request: Request, db: Session = Depends(get_db)):
    """현재 관리자 정보 조회"""
    user = require_admin(request, db)
    return admin_settings_service.get_admin_info(user)


# ✅ 관리자 비밀번호 변경
@router.post("/change-password")
async def change_admin_password(request: Request, db: Session = Depends(get_db)):
    """관리자 비밀번호 변경"""
    user = require_admin(request, db)
    data = await request.json()

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        raise HTTPException(400, "현재 비밀번호와 새 비밀번호를 입력해주세요.")

    return admin_settings_service.change_password(db, user, current_password, new_password)


# ✅ 관리자 비밀번호 확인
@router.post("/verify-password")
async def verify_admin_password(request: Request, db: Session = Depends(get_db)):
    """현재 비밀번호 검증"""
    user = require_admin(request, db)
    data = await request.json()

    password = data.get("password")
    if not password:
        raise HTTPException(400, "비밀번호를 입력해주세요.")

    valid = verify_password(password, user.password_hash)
    return {"valid": valid}


# ✅ 관리자 닉네임 변경
@router.put("/update-profile")
async def update_admin_profile(request: Request, db: Session = Depends(get_db)):
    """관리자 닉네임 수정"""
    user = require_admin(request, db)
    data = await request.json()

    nickname = data.get("nickname")
    if not nickname:
        raise HTTPException(400, "닉네임을 입력해주세요.")

    # 닉네임 유효성 검사
    import re
    if len(nickname) < 2 or len(nickname) > 15:
        raise HTTPException(400, "닉네임은 2~15자 사이여야 합니다.")
    if not re.match(r"^[가-힣a-zA-Z0-9]+$", nickname):
        raise HTTPException(400, "닉네임은 한글, 영문, 숫자만 가능합니다.")

    # 닉네임 중복 확인
    from app.services.user_service import get_user_by_nickname
    existing = get_user_by_nickname(db, nickname)
    if existing and existing.id != user.id:
        raise HTTPException(409, "이미 사용 중인 닉네임입니다.")

    user.nickname = nickname
    user.updated_at = func.now()
    db.commit()
    db.refresh(user)

    return {"message": "닉네임이 수정되었습니다.", "nickname": user.nickname}
