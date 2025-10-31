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
async def admin_list_events(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    events = calendar_service.list_events()
    return {"events": events, "total_count": len(events)}

@router.get("/admin/events/{event_id}", response_model=CalendarEventResponse)
async def admin_get_event(request: Request, event_id: str, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    event = calendar_service.get_event(event_id)
    return event

@router.post("/admin/events", response_model=CalendarEventResponse)
async def admin_create_event(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    data = await request.json()
    event = calendar_service.create_event(data)
    return event

@router.put("/admin/events/{event_id}", response_model=CalendarEventResponse)
async def admin_update_event(request: Request, event_id: str, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    data = await request.json()
    event = calendar_service.update_event(event_id, data)
    return event

@router.delete("/admin/events/{event_id}")
async def admin_delete_event(request: Request, event_id: str, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    result = calendar_service.delete_event(event_id)
    return JSONResponse(result)
