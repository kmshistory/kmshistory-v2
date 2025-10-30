# app/routers/auth_api_router.py
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import auth_service
from app.utils.auth import get_current_user_from_cookie

router = APIRouter(prefix="/api/auth", tags=["Auth:API"])

@router.post("/register")
async def register(request: Request, db: Session = Depends(get_db)):
    result = await auth_service.register_service(request, db)
    return JSONResponse(result)

@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    from fastapi import Response
    response = Response()
    result = await auth_service.login_service(request, response, db)
    # 쿠키가 이미 response에 세팅됨
    return JSONResponse(result, headers=dict(response.headers))

@router.post("/logout")
async def logout():
    from fastapi import Response
    response = Response()
    result = auth_service.logout_service(response)
    return JSONResponse(result, headers=dict(response.headers))

@router.post("/send-code")
async def send_code(request: Request, db: Session = Depends(get_db)):
    result = await auth_service.send_verification_code_service(request, db)
    return JSONResponse(result)

@router.post("/verify-email")
async def verify_email(request: Request, db: Session = Depends(get_db)):
    result = await auth_service.verify_email_code_service(request, db)
    return JSONResponse(result)

@router.post("/check-email")
async def check_email(request: Request, db: Session = Depends(get_db)):
    """이메일 중복 확인"""
    result = await auth_service.check_email_duplicate_service(request, db)
    return JSONResponse(result)

@router.post("/check-nickname")
async def check_nickname(request: Request, db: Session = Depends(get_db)):
    """닉네임 중복 확인"""
    result = await auth_service.check_nickname_duplicate_service(request, db)
    return JSONResponse(result)


@router.post("/password/change")
async def change_password(request: Request, db: Session = Depends(get_db)):
    current = get_current_user_from_cookie(request, db)
    result = await auth_service.change_password_service(request, db, current)
    return JSONResponse(result)

@router.post("/password/reset/request")
async def reset_request(request: Request, db: Session = Depends(get_db)):
    result = await auth_service.password_reset_request_service(request, db)
    return JSONResponse(result)

@router.post("/password/reset/confirm")
async def reset_confirm(request: Request, db: Session = Depends(get_db)):
    result = await auth_service.password_reset_confirm_service(request, db)
    return JSONResponse(result)

@router.get("/me")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """현재 로그인 사용자 정보 조회"""
    user = get_current_user_from_cookie(request, db)
    return {
        "id": user.id,
        "email": user.email,
        "nickname": user.nickname,
        "role": user.role,
        "is_active": user.is_active,
    }

