from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional
from datetime import datetime
from app.services.google_calendar_service import google_calendar_service
from app.schemas.calendar_schema import CalendarEventResponse


class CalendarService:
    """Google Calendar 래핑 서비스"""

    def list_events(self, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """이벤트 목록 조회"""
        try:
            time_min = datetime.fromisoformat(start_date.replace('Z', '+00:00')) if start_date else None
            time_max = datetime.fromisoformat(end_date.replace('Z', '+00:00')) if end_date else None
            events = google_calendar_service.list_events(time_min=time_min, time_max=time_max)
            return events
        except Exception as e:
            raise HTTPException(500, f"일정 목록 조회 중 오류: {str(e)}")

    def get_event(self, event_id: str):
        """단일 이벤트 조회"""
        try:
            event = google_calendar_service.get_event(event_id)
            return event
        except Exception as e:
            raise HTTPException(500, f"일정 조회 중 오류: {str(e)}")

    def create_event(self, data: dict):
        """이벤트 생성"""
        try:
            return google_calendar_service.create_event(
                summary=data["summary"],
                start_time=data["start"],
                end_time=data["end"],
                description=data.get("description", ""),
                location=data.get("location", "")
            )
        except Exception as e:
            raise HTTPException(500, f"이벤트 생성 중 오류: {str(e)}")

    def update_event(self, event_id: str, data: dict):
        """이벤트 수정"""
        try:
            return google_calendar_service.update_event(
                event_id=event_id,
                summary=data.get("summary"),
                start_time=data.get("start"),
                end_time=data.get("end"),
                description=data.get("description"),
                location=data.get("location")
            )
        except Exception as e:
            raise HTTPException(500, f"이벤트 수정 중 오류: {str(e)}")

    def delete_event(self, event_id: str):
        """이벤트 삭제"""
        try:
            google_calendar_service.delete_event(event_id)
            return {"message": "이벤트가 삭제되었습니다."}
        except Exception as e:
            raise HTTPException(500, f"이벤트 삭제 중 오류: {str(e)}")


calendar_service = CalendarService()
