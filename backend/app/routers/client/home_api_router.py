from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import participant_service

router = APIRouter(prefix="/api/home", tags=["Client:Home:API"])

@router.get("/stats")
async def get_home_stats(db: Session = Depends(get_db)):
    """홈페이지 기본 통계 조회 (JSON 응답)"""
    try:
        all_participants = participant_service.get_all_participants_for_selection(db)
        total_participants = len(all_participants)
        participants_with_email = len([p for p in all_participants if p.email])
        participants_with_description = len([p for p in all_participants if p.description])

        return {
            "total_participants": total_participants,
            "participants_with_email": participants_with_email,
            "participants_with_description": participants_with_description,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"홈 통계 조회 중 오류가 발생했습니다: {str(e)}")
