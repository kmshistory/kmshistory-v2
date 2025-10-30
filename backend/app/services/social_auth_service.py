from google_auth_oauthlib.flow import Flow
from fastapi import HTTPException
from app.config import settings
import json, os

def create_google_flow():
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=[
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
            'https://www.googleapis.com/auth/yt-analytics-monetary.readonly'
        ]
    )
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    return flow

def get_google_auth_url():
    try:
        flow = create_google_flow()
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'
        )
        return authorization_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google OAuth URL 생성 실패: {str(e)}")

def handle_google_callback(code: str):
    try:
        flow = create_google_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        with open('token.json', 'w') as token:
            token.write(credentials.to_json())
        return {"message": "Google 인증 성공", "token_info": credentials.to_json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google OAuth 콜백 처리 실패: {str(e)}")
