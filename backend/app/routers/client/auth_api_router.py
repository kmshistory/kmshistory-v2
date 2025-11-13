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
    try:
        response = Response()
        result = await auth_service.login_service(request, response, db)
        # 쿠키가 이미 response에 세팅됨
        # JSONResponse를 생성하고 쿠키를 복사
        json_response = JSONResponse(result)
        # 쿠키 헤더 복사
        for header_name, header_value in response.headers.items():
            if header_name.lower() == "set-cookie":
                json_response.headers.append(header_name, header_value)
        return json_response
    except Exception as e:
        import traceback
        print(f"[ERROR] /api/auth/login 에러 발생: {str(e)}")
        traceback.print_exc()
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"로그인 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/logout")
async def logout():
    from fastapi import Response
    response = Response()
    result = auth_service.logout_service(response)
    return JSONResponse(result, headers=dict(response.headers))

@router.get("/verify-signup")
async def verify_signup(token: str, db: Session = Depends(get_db)):
    result = await auth_service.verify_signup_token_service(token, db)
    return JSONResponse(result)

@router.post("/check-email")
async def check_email(request: Request, db: Session = Depends(get_db)):
    """이메일 중복 확인"""
    try:
        result = await auth_service.check_email_duplicate_service(request, db)
        return JSONResponse(result)
    except Exception as e:
        import traceback
        print(f"[ERROR] /api/auth/check-email 에러 발생: {str(e)}")
        traceback.print_exc()
        from fastapi import HTTPException, status
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이메일 중복확인 중 오류가 발생했습니다: {str(e)}"
        )

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

@router.post("/forgot-password")
async def forgot_password(request: Request, db: Session = Depends(get_db)):
    """비밀번호 찾기 요청 (alias for /password/reset/request) - 프론트엔드와 경로 매칭"""
    result = await auth_service.password_reset_request_service(request, db)
    return JSONResponse(result)

@router.get("/verify-reset-token")
async def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """비밀번호 재설정 토큰 검증"""
    from app.services.auth_service import verify_password_reset_token
    from app.models import User
    from fastapi import HTTPException
    import jwt
    from app.config import settings
    
    try:
        # 토큰 검증 (직접 검증)
        secret_key = settings.SECRET_KEY
        try:
            payload = jwt.decode(token, secret_key, algorithms=["HS256"])
            if payload.get("type") != "password_reset":
                raise HTTPException(status_code=400, detail="잘못된 토큰입니다.")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=400, detail="토큰이 만료되었습니다.")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=400, detail="잘못된 토큰입니다.")
        
        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="유효하지 않은 토큰입니다.")
        
        # 사용자 확인
        user = db.query(User).filter(User.email == email, User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        return {"valid": True, "message": "토큰이 유효합니다."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"토큰 검증 실패: {str(e)}")

@router.post("/password/reset/confirm")
async def reset_confirm(request: Request, db: Session = Depends(get_db)):
    result = await auth_service.password_reset_confirm_service(request, db)
    return JSONResponse(result)

@router.post("/reset-password")
async def reset_password(request: Request, db: Session = Depends(get_db)):
    """비밀번호 재설정 (alias for /password/reset/confirm) - 프론트엔드와 경로 매칭"""
    # 프론트엔드가 /auth/reset-password로 요청하므로 같은 서비스 함수 사용
    result = await auth_service.password_reset_confirm_service(request, db)
    return JSONResponse(result)

@router.get("/me")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """현재 로그인 사용자 정보 조회"""
    from fastapi import HTTPException, status
    
    try:
        user = get_current_user_from_cookie(request, db)
        return {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "role": user.role,
            "is_active": user.is_active,
            "is_email_verified": user.is_email_verified if hasattr(user, 'is_email_verified') else False,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    except HTTPException:
        # HTTPException은 그대로 전파 (401 등)
        raise
    except Exception as e:
        # 예상치 못한 에러 발생 시
        import traceback
        print(f"[ERROR] /api/auth/me 에러 발생: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 정보를 가져오는 중 오류가 발생했습니다"
        )

