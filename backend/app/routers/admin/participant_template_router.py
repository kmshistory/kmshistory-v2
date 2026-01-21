from fastapi import APIRouter, Request, Depends, Form, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.templates import templates
from app.services.participant_service import participant_service
from app.schemas.participant_schema import ParticipantCreate

router = APIRouter(tags=["Participant:Templates"])


@router.get("/candidates", response_class=HTMLResponse)
async def candidates_page(request: Request, page: int = 1, db: Session = Depends(get_db)):
    """대상자 목록 페이지"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)
    participants, total = participant_service.get_all_participants(db, 10, (page - 1) * 10)
    return templates.TemplateResponse(
        "client/subscribers/candidates.html",
        {"request": request, "participants": participants, "total_count": total, "title": "대상자 관리"},
    )


@router.post("/candidates/upload")
async def upload_candidates_excel(
    request: Request, file: UploadFile, replace_all: bool = Form(False), db: Session = Depends(get_db)
):
    """엑셀 업로드"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)
    message = participant_service.upload_excel_file(db, file, replace_all)
    return RedirectResponse(url=f"/candidates?message={message}", status_code=303)
