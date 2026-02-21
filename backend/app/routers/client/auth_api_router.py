# app/routers/auth_api_router.py
from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import auth_service
from app.services.social_auth_service import (
    get_google_login_url_simple,
    exchange_google_code_for_userinfo,
)
from app.services.naver_auth_service import get_naver_login_url, exchange_naver_code_for_userinfo
from app.utils.auth import create_pending_signup_token
from app.utils.auth import get_current_user_from_cookie
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Auth:API"])


# ---------- 구글 로그인 (클라이언트) ----------
@router.get("/google")
async def auth_google_start():
    """구글 로그인 시작. 기존 유저=즉시 로그인, 신규=약관 동의 후 complete-signup."""
    url = get_google_login_url_simple()
    return RedirectResponse(url=url, status_code=302)


@router.get("/google/callback")
async def auth_google_callback(
    code: str | None = Query(None),
    error: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """구글 로그인 콜백. 기존 유저=즉시 로그인, 신규=pending_signup 토큰으로 리다이렉트."""
    from fastapi import Response

    if error:
        redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?error={error}"
        return RedirectResponse(url=redirect_url, status_code=302)
    if not code:
        redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?error=no_code"
        return RedirectResponse(url=redirect_url, status_code=302)

    try:
        userinfo = exchange_google_code_for_userinfo(code)
    except Exception:
        redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?error=google_auth_failed"
        return RedirectResponse(url=redirect_url, status_code=302)

    from app.models import User
    user = db.query(User).filter(User.email == (userinfo.get("email") or "").strip()).first()

    if user:
        response = Response()
        try:
            auth_service.google_login_or_register_service(userinfo, response, db, agreement=None)
        except Exception:
            redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?error=login_failed"
            return RedirectResponse(url=redirect_url, status_code=302)
        redirect_url = settings.FRONTEND_URL.rstrip("/")
        res = RedirectResponse(url=redirect_url, status_code=302)
        for name, value in response.headers.items():
            if name.lower() == "set-cookie":
                res.headers.append(name, value)
        return res

    pending_token = create_pending_signup_token(userinfo)
    redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?pending_signup={pending_token}"
    return RedirectResponse(url=redirect_url, status_code=302)


# ---------- 네이버 로그인 (클라이언트) ----------
@router.get("/naver")
async def auth_naver_start():
    """네이버 로그인 시작."""
    url = get_naver_login_url()
    return RedirectResponse(url=url, status_code=302)


@router.get("/naver/callback")
async def auth_naver_callback(
    code: str | None = Query(None),
    state: str | None = Query(None),
    error: str | None = Query(None),
    error_description: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """네이버 로그인 콜백."""
    from fastapi import Response

    if error:
        err_msg = error_description or error
        redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?error=naver_auth_failed"
        if err_msg:
            from urllib.parse import quote
            redirect_url += f"&error_detail={quote(str(err_msg))}"
        return RedirectResponse(url=redirect_url, status_code=302)
    if not code:
        redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?error=no_code"
        return RedirectResponse(url=redirect_url, status_code=302)

    try:
        userinfo = exchange_naver_code_for_userinfo(code)
    except Exception:
        redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?error=naver_auth_failed"
        return RedirectResponse(url=redirect_url, status_code=302)

    from app.models import User
    user = db.query(User).filter(User.email == (userinfo.get("email") or "").strip()).first()

    if user:
        response = Response()
        try:
            auth_service.google_login_or_register_service(userinfo, response, db, agreement=None)
        except Exception:
            redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?error=login_failed"
            return RedirectResponse(url=redirect_url, status_code=302)
        redirect_url = settings.FRONTEND_URL.rstrip("/")
        res = RedirectResponse(url=redirect_url, status_code=302)
        for name, value in response.headers.items():
            if name.lower() == "set-cookie":
                res.headers.append(name, value)
        return res

    pending_token = create_pending_signup_token(userinfo)
    redirect_url = f"{settings.FRONTEND_URL.rstrip('/')}/login?pending_signup={pending_token}"
    return RedirectResponse(url=redirect_url, status_code=302)


@router.post("/google/complete-signup")
async def google_complete_signup(request: Request, db: Session = Depends(get_db)):
    """신규 가입 시 약관 동의 후 가입 완료 (pending_signup 토큰 필수)."""
    from fastapi import Response

    try:
        body = await request.json()
        pending_token = body.get("pending_signup", "").strip()
        if not pending_token:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="pending_signup 토큰이 필요합니다.")

        agreement = {
            "agree_terms": bool(body.get("agree_terms")),
            "agree_privacy": bool(body.get("agree_privacy")),
            "agree_collection": bool(body.get("agree_collection")),
            "agree_marketing": bool(body.get("agree_marketing")),
        }
        if not (agreement["agree_terms"] and agreement["agree_privacy"] and agreement["agree_collection"]):
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="필수 약관에 모두 동의해 주세요.")

        response = Response()
        auth_service.google_complete_signup_service(pending_token, agreement, response, db)
        json_res = JSONResponse({"message": "회원가입이 완료되었습니다."})
        for name, value in response.headers.items():
            if name.lower() == "set-cookie":
                json_res.headers.append(name, value)
        return json_res
    except Exception as e:
        from fastapi import HTTPException
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=400, detail=str(e) or "가입 완료 처리에 실패했습니다.")


# ---------- 로컬 회원가입 비활성화 (구글 로그인만 사용) ----------
@router.post("/register")
async def register(request: Request, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    raise HTTPException(status_code=410, detail="회원가입은 구글 로그인으로만 가능합니다.")

@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    """로컬 로그인 (관리자용 이메일/비밀번호). 일반 유저는 구글 로그인 사용."""
    from fastapi import Response
    try:
        response = Response()
        result = await auth_service.login_service(request, response, db)
        json_response = JSONResponse(result)
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
    from fastapi import HTTPException
    raise HTTPException(status_code=410, detail="회원가입은 구글 로그인으로만 가능합니다.")

@router.post("/check-email")
async def check_email(request: Request, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    raise HTTPException(status_code=410, detail="회원가입은 구글 로그인으로만 가능합니다.")

@router.post("/check-email_unused")
async def check_email_unused(request: Request, db: Session = Depends(get_db)):
    """이메일 중복 확인 (구글 전용으로 비활성화)."""
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
    from fastapi import HTTPException
    raise HTTPException(status_code=410, detail="회원가입은 구글 로그인으로만 가능합니다.")

@router.post("/check-nickname_unused")
async def check_nickname_unused(request: Request, db: Session = Depends(get_db)):
    """닉네임 중복 확인 (구글 전용으로 비활성화)."""
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

