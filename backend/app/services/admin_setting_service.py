from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy import func
from app.utils.auth import verify_password, get_password_hash

class AdminSettingsService:
    """관리자 계정 설정 서비스"""

    def get_admin_info(self, current_user):
        return {
            "id": current_user.id,
            "email": current_user.email,
            "nickname": current_user.nickname,
            "role": current_user.role,
            "created_at": current_user.created_at,
        }

    def change_password(self, db: Session, current_user, current_password: str, new_password: str):
        if not verify_password(current_password, current_user.password_hash):
            raise HTTPException(400, "현재 비밀번호가 일치하지 않습니다.")
        current_user.password_hash = get_password_hash(new_password)
        current_user.updated_at = func.now()
        db.commit()
        return {"message": "비밀번호가 변경되었습니다."}

admin_settings_service = AdminSettingsService()
