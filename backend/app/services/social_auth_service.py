from google_auth_oauthlib.flow import Flow
from fastapi import HTTPException
from app.config import settings
import os
import httpx

# 클라이언트(일반 유저) 구글 로그인용 스코프 (openid, 이메일, 프로필)
CLIENT_LOGIN_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

DEFAULT_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/yt-analytics-monetary.readonly'
]


def create_google_flow(
    *,
    redirect_uri: str | None = None,
    scopes: list[str] | None = None,
):
    """Google OAuth Flow 생성"""
    target_redirect_uri = redirect_uri or settings.GOOGLE_REDIRECT_URI
    if not target_redirect_uri:
        raise HTTPException(status_code=500, detail="Google Redirect URI가 설정되지 않았습니다.")

    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [target_redirect_uri],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=scopes or DEFAULT_SCOPES,
    )
    flow.redirect_uri = target_redirect_uri
    return flow


def get_google_auth_url(
    *,
    redirect_uri: str | None = None,
    scopes: list[str] | None = None,
    state: str | None = None,
):
    """Google 인증 URL 생성. state는 콜백에서 그대로 반환됨."""
    try:
        flow = create_google_flow(redirect_uri=redirect_uri, scopes=scopes)
        kwargs = dict(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )
        if state:
            kwargs["state"] = state
        authorization_url, _ = flow.authorization_url(**kwargs)
        return authorization_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google OAuth URL 생성 실패: {str(e)}")


def handle_google_callback(
    code: str,
    *,
    redirect_uri: str | None = None,
    token_file: str | None = None,
    scopes: list[str] | None = None,
):
    """Google OAuth 콜백 처리 및 토큰 저장"""
    try:
        flow = create_google_flow(redirect_uri=redirect_uri, scopes=scopes)
        flow.fetch_token(code=code)
        credentials = flow.credentials

        output_path = token_file or os.path.join(os.getcwd(), "token.json")
        with open(output_path, "w") as token:
            token.write(credentials.to_json())

        return {"message": "Google 인증 성공", "token_info": credentials.to_json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google OAuth 콜백 처리 실패: {str(e)}")


def get_google_client_login_redirect_uri() -> str:
    """클라이언트 구글 로그인 콜백 URL (동일 도메인 /api 경로). Google Console에 등록 필요."""
    base = (settings.FRONTEND_URL or "").rstrip("/")
    if not base:
        raise HTTPException(status_code=500, detail="FRONTEND_URL이 설정되지 않았습니다.")
    return f"{base}/api/auth/google/callback"


def _encode_agreement_state(agree_terms: bool, agree_privacy: bool, agree_collection: bool, agree_marketing: bool) -> str:
    """약관 동의 값을 base64url로 인코딩 (OAuth state 전달용)."""
    import base64
    data = f"t:{int(agree_terms)},p:{int(agree_privacy)},c:{int(agree_collection)},m:{int(agree_marketing)}"
    return base64.urlsafe_b64encode(data.encode()).decode().rstrip("=")


def _decode_agreement_state(state: str | None) -> dict | None:
    """OAuth state에서 약관 동의 값 디코딩. 실패 시 None."""
    if not state:
        return None
    try:
        import base64
        padded = state + "=" * (4 - len(state) % 4)
        data = base64.urlsafe_b64decode(padded).decode()
        parts = {}
        for item in data.split(","):
            k, v = item.split(":")
            parts[k] = v == "1"
        return {
            "agree_terms": parts.get("t", True),
            "agree_privacy": parts.get("p", True),
            "agree_collection": parts.get("c", True),
            "agree_marketing": parts.get("m", False),
        }
    except Exception:
        return None


def get_google_login_url_for_client(
    *,
    agree_terms: bool = True,
    agree_privacy: bool = True,
    agree_collection: bool = True,
    agree_marketing: bool = False,
) -> str:
    """일반 유저 구글 로그인 시작 URL. (약관 동의 호환용 - 서버 상태 판단 시 state 생략 가능)"""
    redirect_uri = get_google_client_login_redirect_uri()
    state = _encode_agreement_state(agree_terms, agree_privacy, agree_collection, agree_marketing)
    return get_google_auth_url(redirect_uri=redirect_uri, scopes=CLIENT_LOGIN_SCOPES, state=state)


def get_google_login_url_simple() -> str:
    """구글 로그인 시작 URL (약관 없이, 서버에서 기존/신규 판단 시 사용)."""
    import secrets
    redirect_uri = get_google_client_login_redirect_uri()
    state = secrets.token_urlsafe(16)  # CSRF 방지용
    return get_google_auth_url(redirect_uri=redirect_uri, scopes=CLIENT_LOGIN_SCOPES, state=state)


def decode_agreement_from_state(state: str | None) -> dict | None:
    """OAuth state에서 약관 동의 값 디코딩 (라우터에서 사용)."""
    return _decode_agreement_state(state)


def exchange_google_code_for_userinfo(code: str) -> dict:
    """
    인증 코드로 토큰 교환 후 Google userinfo 조회.
    Returns: {"email": str, "name": str, "picture": str | None}
    """
    redirect_uri = get_google_client_login_redirect_uri()
    flow = create_google_flow(redirect_uri=redirect_uri, scopes=CLIENT_LOGIN_SCOPES)
    flow.fetch_token(code=code)
    credentials = flow.credentials

    # userinfo 요청
    with httpx.Client() as client:
        resp = client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {credentials.token}"},
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()

    return {
        "email": (data.get("email") or "").strip(),
        "name": (data.get("name") or data.get("email") or "사용자").strip(),
        "picture": data.get("picture"),
    }
