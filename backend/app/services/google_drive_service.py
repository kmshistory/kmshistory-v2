import os
import io
import json
from typing import Optional, Dict, Any
from datetime import datetime

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseUpload

from app.config import settings

class GoogleDriveService:
    """Google Drive API 서비스"""

    SCOPES = [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/yt-analytics.readonly",
        "https://www.googleapis.com/auth/yt-analytics-monetary.readonly"
    ]

    def __init__(self):
        self.credentials = None
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Google Drive API 인증 (OAuth 토큰 기반)"""
        creds = None
        token_file = "token.json"

        if os.path.exists(token_file):
            try:
                creds = Credentials.from_authorized_user_file(token_file, self.SCOPES)
            except Exception as e:
                print(f"⚠️ 토큰 파일 읽기 실패: {e}")

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    print("✅ Google Drive 토큰 갱신 성공")
                except Exception as e:
                    print(f"❌ 토큰 갱신 실패: {e}")
                    creds = None
            else:
                print("⚠️ 유효한 Google 인증 정보가 없습니다.")
                self.credentials = None
                self.service = None
                return

            with open(token_file, "w") as token:
                token.write(creds.to_json())

        self.credentials = creds
        self.service = build("drive", "v3", credentials=creds)
        print("✅ Google Drive 서비스 초기화 완료")

    def upload_file(self, file_content: bytes, filename: str, mime_type: str, folder_id: Optional[str] = None):
        """Google Drive에 파일 업로드"""
        if not self.service:
            raise Exception("Google Drive 서비스가 초기화되지 않았습니다.")

        try:
            metadata = {"name": filename}
            if folder_id:
                metadata["parents"] = [folder_id]

            media = MediaIoBaseUpload(io.BytesIO(file_content), mimetype=mime_type, resumable=True)

            file = self.service.files().create(
                body=metadata,
                media_body=media,
                fields="id,name,webViewLink,webContentLink,size,createdTime"
            ).execute()

            file_id = file.get("id")

            # 이미지 파일인 경우 공개 설정
            if mime_type.startswith("image/"):
                permission = {"type": "anyone", "role": "reader"}
                self.service.permissions().create(fileId=file_id, body=permission).execute()

            return {
                "file_id": file_id,
                "filename": file.get("name"),
                "web_view_link": file.get("webViewLink"),
                "download_link": file.get("webContentLink"),
                "file_size": int(file.get("size", 0)),
                "created_time": file.get("createdTime")
            }

        except HttpError as e:
            raise Exception(f"Google Drive 업로드 실패: {e}")

google_drive_service = GoogleDriveService()
