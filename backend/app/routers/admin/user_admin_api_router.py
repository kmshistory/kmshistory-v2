# app/routers/users_admin_api_router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services import user_service
from app.schemas.user_schema import UserResponse, UserPageResponse

router = APIRouter(prefix="/api/admin/users", tags=["Admin:Users"])

def require_admin(request: Request, db: Session):
    u = get_current_user_from_cookie(request, db)
    if u.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    return u

# ===== 목록/카운트 =====

@router.get("", response_model=UserPageResponse)
async def list_users(
    request: Request,
    page: int = 1,
    limit: int = 10,
    q: str | None = None,
    role: str | None = None,
    is_active: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db)
):
    require_admin(request, db)
    page_obj = user_service.list_users_admin(db, page, limit, q, role, is_active, status)
    return page_obj

@router.get("/count")
async def count_users(
    request: Request,
    q: str | None = None,
    role: str | None = None,
    is_active: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db)
):
    require_admin(request, db)
    total = user_service.count_users_admin(db, q, role, is_active, status)
    return {"total_count": total}

# ===== 생성/상세/수정/삭제 =====

@router.post("")
async def create_user(request: Request, db: Session = Depends(get_db)):
    require_admin(request, db)
    data = await request.json()
    result = user_service.create_user_admin(db, data)
    return JSONResponse(result)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(request: Request, user_id: int, db: Session = Depends(get_db)):
    require_admin(request, db)
    user = user_service.get_user_admin(db, user_id)
    return user

@router.put("/{user_id}")
async def update_user(request: Request, user_id: int, db: Session = Depends(get_db)):
    require_admin(request, db)
    data = await request.json()
    user_service.update_user_admin(db, user_id, data)
    return {"message": "사용자가 수정되었습니다."}

@router.delete("/{user_id}")
async def soft_delete_user(request: Request, user_id: int, db: Session = Depends(get_db)):
    require_admin(request, db)
    return user_service.soft_delete_user_admin(db, user_id)

# ===== 상태/역할 관리 =====

@router.post("/{user_id}/block")
async def block_user(request: Request, user_id: int, db: Session = Depends(get_db)):
    admin = require_admin(request, db)
    data = await request.json()
    reason = data.get("reason")
    # 자기 자신 차단 방지 & 관리자 보호는 서비스단에서도 가능하지만 여기서도 1차 예방 가능
    if admin.id == user_id:
        raise HTTPException(400, "본인 계정은 차단할 수 없습니다.")
    target = user_service.get_user_admin(db, user_id)
    if target.role == "admin":
        raise HTTPException(400, "관리자 계정은 차단할 수 없습니다.")
    return user_service.block_user_admin(db, user_id, reason)

@router.post("/{user_id}/unblock")
async def unblock_user(request: Request, user_id: int, db: Session = Depends(get_db)):
    require_admin(request, db)
    return user_service.unblock_user_admin(db, user_id)

@router.post("/{user_id}/activate")
async def activate_user(request: Request, user_id: int, db: Session = Depends(get_db)):
    require_admin(request, db)
    return user_service.activate_user_admin(db, user_id)

@router.delete("/{user_id}/permanent")
async def delete_user_permanent(request: Request, user_id: int, db: Session = Depends(get_db)):
    admin = require_admin(request, db)
    return user_service.delete_user_permanent_admin(db, user_id, acting_admin_id=admin.id)

@router.put("/{user_id}/role")
async def change_user_role(request: Request, user_id: int, db: Session = Depends(get_db)):
    require_admin(request, db)
    data = await request.json()
    new_role = data.get("role")
    if not new_role:
        raise HTTPException(400, "role 값이 필요합니다.")
    return user_service.change_user_role_admin(db, user_id, new_role)
