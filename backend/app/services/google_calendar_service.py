import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings


# 로거 설정
logger = logging.getLogger(__name__)


class GoogleCalendarService:
    """Google Calendar API 서비스 클래스"""

    SCOPES = ["https://www.googleapis.com/auth/calendar"]

    def __init__(self):
        self.service = None
        self.credentials = None
        self.token_path = settings.GOOGLE_TOKEN_FILE or os.path.join(os.getcwd(), "token.json")
        if not os.path.isabs(self.token_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.token_path = os.path.join(base_dir, self.token_path)
        self._authenticate()

    # ---------------------------
    # 🔐 인증
    # ---------------------------
    def _authenticate(self):
        """Google Calendar API 인증"""
        creds = None

        # token.json 확인
        if os.path.exists(self.token_path):
            try:
                creds = Credentials.from_authorized_user_file(self.token_path, self.SCOPES)
                logger.info("✅ 기존 Google Calendar 토큰 로드 성공")
            except Exception as e:
                logger.warning(f"❌ 토큰 파일 읽기 실패: {e}")

        # 토큰 갱신 시도
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                logger.info("🔄 토큰 갱신 성공")

                # 갱신된 토큰 저장
                with open(self.token_path, "w") as token:
                    token.write(creds.to_json())
            except Exception as e:
                logger.error(f"⚠️ 토큰 갱신 실패: {e}")
                creds = None

        if not creds or not creds.valid:
            logger.error("❌ Google Calendar 인증 실패 (유효한 토큰 없음)")
            self.service = None
            self.credentials = None
            return

        # 서비스 빌드
        try:
            self.credentials = creds
            self.service = build("calendar", "v3", credentials=creds)
            logger.info("✅ Google Calendar 서비스 초기화 완료")
        except Exception as e:
            logger.error(f"Google Calendar 서비스 초기화 실패: {e}")
            self.service = None

    # ---------------------------
    # 📅 일정 조회
    # ---------------------------
    def list_events(
        self,
        calendar_id: Optional[str] = None,
        time_min: Optional[datetime] = None,
        time_max: Optional[datetime] = None,
        max_results: int = 100,
    ) -> List[Dict[str, Any]]:
        """캘린더 일정 목록 조회"""
        if not self.service:
            raise Exception("Google Calendar 서비스가 초기화되지 않았습니다.")

        try:
            calendar_id = calendar_id or settings.GOOGLE_CALENDAR_ID

            def to_rfc3339(dt: Optional[datetime]) -> Optional[str]:
                if not dt:
                    return None
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
                return dt.isoformat().replace("+00:00", "Z")

            time_min_iso = to_rfc3339(time_min or datetime.utcnow())
            time_max_iso = to_rfc3339(time_max) if time_max else None

            params = {
                "calendarId": calendar_id,
                "timeMin": time_min_iso,
                "maxResults": max_results,
                "singleEvents": True,
                "orderBy": "startTime",
                "showDeleted": False,
            }
            if time_max_iso:
                params["timeMax"] = time_max_iso

            result = self.service.events().list(**params).execute()
            events = result.get("items", [])

            formatted = []
            for e in events:
                formatted.append(self._format_event(e))

            return formatted
        except HttpError as e:
            logger.error(f"📅 일정 목록 조회 실패: {e}")
            raise Exception(f"일정 목록 조회 실패: {e}")

    # ---------------------------
    # 📌 단일 일정 조회
    # ---------------------------
    def get_event(self, event_id: str, calendar_id: Optional[str] = None) -> Dict[str, Any]:
        """단일 일정 조회"""
        if not self.service:
            raise Exception("Google Calendar 서비스가 초기화되지 않았습니다.")

        try:
            calendar_id = calendar_id or settings.GOOGLE_CALENDAR_ID
            event = self.service.events().get(calendarId=calendar_id, eventId=event_id).execute()
            return self._format_event(event)
        except HttpError as e:
            logger.error(f"⚠️ 일정 조회 실패: {e}")
            raise Exception(f"일정 조회 실패: {e}")

    # ---------------------------
    # ➕ 일정 생성
    # ---------------------------
    def create_event(
        self,
        summary: str,
        start_time: str,
        end_time: str,
        description: str = "",
        location: str = "",
        calendar_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """일정 생성"""
        if not self.service:
            raise Exception("Google Calendar 서비스가 초기화되지 않았습니다.")

        try:
            calendar_id = calendar_id or settings.GOOGLE_CALENDAR_ID

            body = {
                "summary": summary or "(제목 없음)",
                "description": description,
                "location": location,
                "start": {"dateTime": start_time, "timeZone": "Asia/Seoul"},
                "end": {"dateTime": end_time, "timeZone": "Asia/Seoul"},
                "visibility": "public",
                "transparency": "opaque",
            }

            created = self.service.events().insert(calendarId=calendar_id, body=body).execute()
            logger.info(f"✅ 일정 생성 완료: {created.get('id')}")
            return self._format_event(created)

        except HttpError as e:
            logger.error(f"⚠️ 일정 생성 실패: {e}")
            raise Exception(f"일정 생성 실패: {e}")

    # ---------------------------
    # ✏️ 일정 수정
    # ---------------------------
    def update_event(
        self,
        event_id: str,
        summary: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
        calendar_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """일정 수정"""
        if not self.service:
            raise Exception("Google Calendar 서비스가 초기화되지 않았습니다.")

        try:
            calendar_id = calendar_id or settings.GOOGLE_CALENDAR_ID
            event = self.service.events().get(calendarId=calendar_id, eventId=event_id).execute()

            if summary is not None:
                event["summary"] = summary
            if description is not None:
                event["description"] = description
            if location is not None:
                event["location"] = location
            if start_time is not None:
                event["start"] = {"dateTime": start_time, "timeZone": "Asia/Seoul"}
            if end_time is not None:
                event["end"] = {"dateTime": end_time, "timeZone": "Asia/Seoul"}

            updated = self.service.events().update(
                calendarId=calendar_id, eventId=event_id, body=event
            ).execute()

            logger.info(f"✏️ 일정 수정 완료: {updated.get('id')}")
            return self._format_event(updated)

        except HttpError as e:
            logger.error(f"⚠️ 일정 수정 실패: {e}")
            raise Exception(f"일정 수정 실패: {e}")

    # ---------------------------
    # ❌ 일정 삭제
    # ---------------------------
    def delete_event(self, event_id: str, calendar_id: Optional[str] = None) -> bool:
        """일정 삭제"""
        if not self.service:
            raise Exception("Google Calendar 서비스가 초기화되지 않았습니다.")

        try:
            calendar_id = calendar_id or settings.GOOGLE_CALENDAR_ID
            self.service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
            logger.info(f"🗑️ 일정 삭제 완료: {event_id}")
            return True
        except HttpError as e:
            logger.error(f"⚠️ 일정 삭제 실패: {e}")
            raise Exception(f"일정 삭제 실패: {e}")

    # ---------------------------
    # 🧩 헬퍼: 일정 포맷 통일
    # ---------------------------
    def _format_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Google Calendar Event 객체를 표준 포맷으로 변환"""
        summary = event.get("summary") or "(제목 없음)"
        return {
            "id": event.get("id"),
            "summary": summary,
            "description": event.get("description", ""),
            "location": event.get("location", ""),
            "start": event.get("start", {}).get("dateTime") or event.get("start", {}).get("date"),
            "end": event.get("end", {}).get("dateTime") or event.get("end", {}).get("date"),
            "creator": event.get("creator", {}).get("email"),
            "htmlLink": event.get("htmlLink"),
            "created": event.get("created"),
            "updated": event.get("updated"),
            "status": event.get("status", "confirmed"),
            "visibility": event.get("visibility", "default"),
        }


# ✅ 싱글톤 인스턴스
google_calendar_service = GoogleCalendarService()
