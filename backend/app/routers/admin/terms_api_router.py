from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services.terms_service import terms_service
from app.schemas.terms_schema import TermsResponse

router = APIRouter(prefix="/api/settings", tags=["Terms"])

def require_admin(request: Request, db: Session):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    return user

@router.get("/{key}", response_model=TermsResponse)
async def get_terms_api(key: str, db: Session = Depends(get_db)):
    """특정 약관 조회"""
    return terms_service.get_terms(db, key)

@router.post("/{key}")
async def save_terms_api(key: str, request: Request, db: Session = Depends(get_db)):
    """특정 약관 생성/수정"""
    require_admin(request, db)
    data = await request.json()
    title = data.get("title", key)
    content = data.get("content", "")
    return terms_service.create_or_update_terms(db, key, title, content)
