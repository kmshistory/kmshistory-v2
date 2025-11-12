from fastapi import APIRouter, Request, Depends, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.schemas.participant_schema import ParticipantCreate
from app.services.participant_service import participant_service

router = APIRouter(prefix="/api/participants", tags=["Participant:API"])


@router.get("")
async def list_participants(
    request: Request,
    page: int = 1,
    limit: int = 10,
    name: str | None = None,
    description: str | None = None,
    email: str | None = None,
    db: Session = Depends(get_db)
):
    """참가자 목록 조회 (검색 지원)"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    
    # 검색 조건이 있으면 검색, 없으면 전체 조회
    if name or description or email:
        participants, total = participant_service.search_participants(
            db, name=name, description=description, email=email, limit=limit, offset=(page - 1) * limit
        )
    else:
        participants, total = participant_service.get_all_participants(db, limit, (page - 1) * limit)
    
    # __dict__를 사용하면 SQLAlchemy의 내부 속성도 포함되므로 필요한 필드만 추출
    participants_data = [
        {
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
        }
        for p in participants
    ]
    
    return JSONResponse({
        "page": page,
        "limit": limit,
        "total": total,
        "participants": participants_data
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


@router.put("/{participant_id}")
async def update_participant(request: Request, participant_id: int, db: Session = Depends(get_db)):
    """참가자 수정"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    data = await request.json()
    participant_service.update_participant(db, participant_id, ParticipantCreate(**data))
    return JSONResponse({"message": "참가자가 수정되었습니다."})


@router.delete("/{participant_id}")
async def delete_participant(request: Request, participant_id: int, db: Session = Depends(get_db)):
    """참가자 삭제"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    participant_service.delete_participant(db, participant_id)
    return JSONResponse({"message": "참가자가 삭제되었습니다."})


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
