from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import JSONResponse, HTMLResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services.social_auth_service import (
    get_google_auth_url,
    handle_google_callback,
    DEFAULT_SCOPES,
)
from app.config import settings

router = APIRouter(prefix="/api/admin/google", tags=["Admin:GoogleOAuth"])


def require_admin(request: Request, db: Session):
    user = get_current_user_from_cookie(request, db)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user


@router.get("/token-auth-url")
def generate_token_auth_url(
    request: Request,
    db: Session = Depends(get_db),
):
    """토큰 발급용 Google OAuth 인증 URL 생성"""
    require_admin(request, db)

    redirect_uri = settings.GOOGLE_TOKEN_REDIRECT_URI or settings.GOOGLE_REDIRECT_URI
    if not redirect_uri:
        raise HTTPException(status_code=500, detail="Google Redirect URI가 설정되지 않았습니다.")

    authorization_url = get_google_auth_url(
        redirect_uri=redirect_uri,
        scopes=DEFAULT_SCOPES,
    )
    return JSONResponse({"authorization_url": authorization_url})


@router.get("/token-callback")
def google_token_callback(
    request: Request,
    code: str | None = Query(None, description="Google OAuth 인증 코드"),
    error: str | None = Query(None, description="Google OAuth 에러 메시지"),
    db: Session = Depends(get_db),
):
    """토큰 발급용 Google OAuth 콜백 처리
    # require_admin(request, db) 제거 (관리자 인증 없이 code만 받아서 처리)

    주의: 이 엔드포인트는 Google OAuth 리다이렉트용이므로
    관리자 인증 없이 code만 받아서 처리합니다.
    """
    # Google OAuth 콜백은 브라우저에서 자동 리다이렉트되므로 인증 불가
    # require_admin 제거


    if error:
        return HTMLResponse(
            content=f"""
            <html>
            <head><title>인증 실패</title></head>
            <body>
                <h1>❌ Google 인증 실패</h1>
                <p>오류: {error}</p>
                <p><a href="/">홈으로 돌아가기</a></p>
            </body>
            </html>
            """,
            status_code=400,
        )

    if not code:
        return HTMLResponse(
            content="""
            <html>
            <head><title>인증 코드 없음</title></head>
            <body>
                <h1>❌ 인증 코드가 없습니다</h1>
                <p><a href="/">홈으로 돌아가기</a></p>
            </body>
            </html>
            """,
            status_code=400,
        )

    redirect_uri = settings.GOOGLE_TOKEN_REDIRECT_URI or settings.GOOGLE_REDIRECT_URI
    result = handle_google_callback(
        code,
        redirect_uri=redirect_uri,
        token_file=settings.GOOGLE_TOKEN_FILE,
        scopes=DEFAULT_SCOPES,
    )

    return HTMLResponse(
        content=f"""
        <html>
        <head>
            <title>인증 완료</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    text-align: center;
                }}
                .success {{
                    color: #28a745;
                    font-size: 48px;
                    margin-bottom: 20px;
                }}
                h1 {{
                    color: #333;
                }}
                p {{
                    color: #666;
                    line-height: 1.6;
                }}
                .button {{
                    display: inline-block;
                    padding: 10px 20px;
                    margin-top: 20px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                }}
                .button:hover {{
                    background-color: #0056b3;
                }}
            </style>
        </head>
        <body>
            <div class="success">✅</div>
            <h1>Google API 인증 완료!</h1>
            <p>토큰이 성공적으로 갱신되었습니다.</p>
            <p>{settings.GOOGLE_TOKEN_FILE} 파일을 확인하세요.</p>
            <a href="/" class="button">홈으로 돌아가기</a>
        </body>
        </html>
        """,
        status_code=200,
    )


