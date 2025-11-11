from google_auth_oauthlib.flow import Flow
from fastapi import HTTPException
from app.config import settings
import os

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
):
    """Google 인증 URL 생성"""
    try:
        flow = create_google_flow(redirect_uri=redirect_uri, scopes=scopes)
        authorization_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )
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
