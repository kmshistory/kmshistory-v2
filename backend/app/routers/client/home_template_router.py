from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.templates import templates
from app.services import participant_service

router = APIRouter(tags=["Client:Home:Templates"])

@router.get("/", response_class=HTMLResponse)
async def home(request: Request, db: Session = Depends(get_db)):
    """클라이언트 메인페이지 (홈)"""
    try:
        all_participants = participant_service.get_all_participants_for_selection(db)
        total_participants = len(all_participants)
        participants_with_email = len([p for p in all_participants if p.email])
        participants_with_description = len([p for p in all_participants if p.description])

        return templates.TemplateResponse(
            "client/index.html",
            {
                "request": request,
                "total_participants": total_participants,
                "participants_with_email": participants_with_email,
                "participants_with_description": participants_with_description,
                "title": "강민성 한국사",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터 조회 중 오류: {str(e)}")
