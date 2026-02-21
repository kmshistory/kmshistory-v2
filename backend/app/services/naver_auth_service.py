"""네이버 OAuth 2.0 로그인 서비스"""
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from app.config import settings

NAVER_AUTH_URL = "https://nid.naver.com/oauth2.0/authorize"
NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
NAVER_USERINFO_URL = "https://openapi.naver.com/v1/nid/me"


def get_naver_client_redirect_uri() -> str:
    """네이버 로그인 콜백 URL. Naver Developers에 등록 필요."""
    base = (settings.FRONTEND_URL or "").rstrip("/")
    if not base:
        raise HTTPException(status_code=500, detail="FRONTEND_URL이 설정되지 않았습니다.")
    return f"{base}/api/auth/naver/callback"


def get_naver_login_url() -> str:
    """네이버 로그인 시작 URL."""
    if not settings.NAVER_CLIENT_ID:
        raise HTTPException(status_code=500, detail="NAVER_CLIENT_ID가 설정되지 않았습니다.")

    redirect_uri = get_naver_client_redirect_uri()
    state = secrets.token_urlsafe(16)
    params = {
        "response_type": "code",
        "client_id": settings.NAVER_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "state": state,
    }
    return f"{NAVER_AUTH_URL}?{urlencode(params)}"


def exchange_naver_code_for_userinfo(code: str) -> dict:
    """
    인증 코드로 토큰 교환 후 네이버 프로필 조회.
    Returns: {"email": str, "name": str, "picture": str | None}
    """
    if not settings.NAVER_CLIENT_ID or not settings.NAVER_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Naver OAuth 설정이 되어 있지 않습니다.")

    redirect_uri = get_naver_client_redirect_uri()

    with httpx.Client() as client:
        token_resp = client.post(
            NAVER_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "client_id": settings.NAVER_CLIENT_ID,
                "client_secret": settings.NAVER_CLIENT_SECRET,
                "code": code,
                "state": "",  # state는 선택
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10.0,
        )
        token_resp.raise_for_status()
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Naver 토큰 발급 실패")

        user_resp = client.get(
            NAVER_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
        user_resp.raise_for_status()
        data = user_resp.json()

    if data.get("resultcode") != "00":
        raise HTTPException(status_code=400, detail=data.get("message", "프로필 조회 실패"))

    resp = data.get("response") or {}
    email = (resp.get("email") or "").strip()
    name = (resp.get("name") or resp.get("nickname") or email or "사용자").strip()
    picture = resp.get("profile_image")

    if not email:
        email = f"naver_{resp.get('id', 'unknown')}@naver.oauth"

    return {
        "email": email,
        "name": name,
        "picture": picture,
    }
