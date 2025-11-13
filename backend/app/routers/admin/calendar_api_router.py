from datetime import datetime, timedelta

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services.calendar_service import calendar_service
from app.schemas.calendar_schema import CalendarEventListResponse, CalendarEventResponse

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])

# ---------------- 클라이언트 ----------------

@router.get("/events", response_model=CalendarEventListResponse)
async def list_events(start_date: str | None = None, end_date: str | None = None):
    events = calendar_service.list_events(start_date, end_date)
    return {"events": events, "total_count": len(events)}


# ---------------- 관리자 ----------------

@router.get("/admin/events", response_model=CalendarEventListResponse)
async def admin_list_events(
    request: Request,
    status: str | None = None,
    include_past: bool = False,
    db: Session = Depends(get_db),
):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    try:
        start_date = None
        end_date = None

        if status == "completed":
            now = datetime.utcnow()
            past_start = now - timedelta(days=365)
            start_date = past_start.isoformat() + "Z"
            end_date = now.isoformat() + "Z"
        elif include_past:
            past_start = datetime.utcnow() - timedelta(days=365)
            start_date = past_start.isoformat() + "Z"

        events = calendar_service.list_events(start_date=start_date, end_date=end_date)
        print(f"[INFO] 일정 목록 조회 성공: {len(events)}개 일정")
        return {"events": events, "total_count": len(events)}
    except HTTPException as e:
        # Google Calendar 서비스가 초기화되지 않았거나 서버 오류인 경우 빈 배열 반환
        if e.status_code == 500:
            import traceback
            print(f"[WARNING] 일정 목록 조회 중 오류 (무시됨): {e.detail}")
            print(f"[WARNING] 상세 에러:\n{traceback.format_exc()}")
            return {"events": [], "total_count": 0}
        # 다른 HTTPException은 그대로 전파 (403, 404 등)
        raise
    except Exception as e:
        # Google Calendar 서비스가 초기화되지 않았거나 다른 오류 발생 시 빈 배열 반환
        import traceback
        print(f"[WARNING] 일정 목록 조회 중 오류 (무시됨): {str(e)}")
        print(f"[WARNING] 상세 에러:\n{traceback.format_exc()}")
        return {"events": [], "total_count": 0}

@router.get("/admin/events/{event_id}", response_model=CalendarEventResponse)
async def admin_get_event(request: Request, event_id: str, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    try:
        event = calendar_service.get_event(event_id)
        return event
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARNING] 일정 조회 중 오류: {str(e)}")
        raise HTTPException(500, f"일정 조회 중 오류가 발생했습니다: {str(e)}")

@router.post("/admin/events", response_model=CalendarEventResponse)
async def admin_create_event(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    data = await request.json()
    # 프론트엔드에서 보내는 형식(start_time, end_time)을 calendar_service 형식(start, end)으로 변환
    event_data = {
        "summary": data.get("summary", ""),
        "start": data.get("start_time") or data.get("start", ""),
        "end": data.get("end_time") or data.get("end", ""),
        "description": data.get("description", ""),
        "location": data.get("location", "")
    }
    try:
        event = calendar_service.create_event(event_data)
        return event
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARNING] 일정 생성 중 오류: {str(e)}")
        raise HTTPException(500, f"일정 생성 중 오류가 발생했습니다: {str(e)}")

@router.put("/admin/events/{event_id}", response_model=CalendarEventResponse)
async def admin_update_event(request: Request, event_id: str, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    data = await request.json()
    # 프론트엔드에서 보내는 형식(start_time, end_time)을 calendar_service 형식(start, end)으로 변환
    event_data = {
        "summary": data.get("summary", ""),
        "start": data.get("start_time") or data.get("start", ""),
        "end": data.get("end_time") or data.get("end", ""),
        "description": data.get("description", ""),
        "location": data.get("location", "")
    }
    try:
        event = calendar_service.update_event(event_id, event_data)
        return event
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARNING] 일정 수정 중 오류: {str(e)}")
        raise HTTPException(500, f"일정 수정 중 오류가 발생했습니다: {str(e)}")

@router.delete("/admin/events/{event_id}")
async def admin_delete_event(request: Request, event_id: str, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    try:
        result = calendar_service.delete_event(event_id)
        return JSONResponse(result)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[WARNING] 일정 삭제 중 오류: {str(e)}")
        raise HTTPException(500, f"일정 삭제 중 오류가 발생했습니다: {str(e)}")
