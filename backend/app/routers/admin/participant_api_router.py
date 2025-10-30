from fastapi import APIRouter, Request, Depends, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.schemas.participant_schema import ParticipantCreate
from app.services.participant_service import participant_service

router = APIRouter(prefix="/api/participants", tags=["Participant:API"])


@router.get("")
async def list_participants(request: Request, page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    """참가자 목록 조회"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    participants, total = participant_service.get_all_participants(db, limit, (page - 1) * limit)
    return JSONResponse({
        "page": page,
        "limit": limit,
        "total": total,
        "participants": [p.__dict__ for p in participants]
    })


@router.post("")
async def create_participant(request: Request, db: Session = Depends(get_db)):
    """참가자 추가"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    data = await request.json()
    participant_service.create_participant(db, ParticipantCreate(**data))
    return JSONResponse({"message": "참가자가 등록되었습니다."})


@router.post("/upload")
async def upload_excel(
    request: Request,
    file: UploadFile,
    replace_all: bool = Form(False),
    db: Session = Depends(get_db)
):
    """엑셀 업로드 (Drive 연동)"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    message = participant_service.upload_excel_file(db, file, replace_all)
    return JSONResponse({"message": message})


@router.delete("")
async def bulk_delete(request: Request, db: Session = Depends(get_db)):
    """대상자 일괄 삭제"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    data = await request.json()
    ids = data.get("ids", [])
    deleted_count = participant_service.bulk_delete_participants(db, ids)
    return JSONResponse({"message": f"{deleted_count}명 삭제 완료"})
