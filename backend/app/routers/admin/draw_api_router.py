from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services import draw_service, participant_service

router = APIRouter(prefix="/api/draw", tags=["Admin:Draw"])


# ✅ 1️⃣ 추첨 목록 조회
@router.get("/list")
async def get_draw_list(
    request: Request,
    db: Session = Depends(get_db),
    page: int = Query(1, description="페이지 번호"),
    limit: int = Query(10, description="한 페이지당 표시 개수"),
    search: str | None = Query(None, description="검색어 (제목/내용)")
):
    """추첨 기록 목록 조회 (관리자용 API)"""
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")

    try:
        records, total = draw_service.list_draw_records(db, search, page, limit)
        total_pages = (total + limit - 1) // limit

        result = [
            {
                "id": r.id,
                "title": r.title,
                "content": r.content,
                "draw_datetime": r.draw_datetime.isoformat() if r.draw_datetime else None,
                "total_participants": r.total_participants,
                "winner_count": r.winner_count,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in records
        ]

        return JSONResponse({
            "message": "추첨 목록 조회 성공",
            "data": result,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": total_pages
            }
        })
    except Exception as e:
        raise HTTPException(500, f"목록 조회 중 오류 발생: {str(e)}")


# ✅ 2️⃣ 추첨 상세 조회
@router.get("/{draw_id}")
async def get_draw_detail_api(request: Request, draw_id: int, db: Session = Depends(get_db)):
    """추첨 상세 조회 (관리자용 API)"""
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")

    try:
        draw, participants = draw_service.get_draw_detail(db, draw_id)
        winners = [p for p in participants if p.is_winner]
        
        # upload_file 정보 포함
        upload_file_data = None
        if draw.upload_file:
            upload_file_data = {
                "id": draw.upload_file.id,
                "original_filename": draw.upload_file.original_filename,
                "file_size": draw.upload_file.file_size,
                "drive_web_view_link": draw.upload_file.drive_web_view_link,
                "created_at": draw.upload_file.created_at.isoformat() if draw.upload_file.created_at else None,
            }

        response_data = {
            "id": draw.id,
            "title": draw.title,
            "content": draw.content,
            "draw_datetime": draw.draw_datetime.isoformat() if draw.draw_datetime else None,
            "total_participants": draw.total_participants,
            "winner_count": draw.winner_count,
            "created_at": draw.created_at.isoformat() if draw.created_at else None,
            "upload_file": upload_file_data,
            "participants": [
                {
                    "id": p.id,
                    "participant_number": p.participant_number,
                    "name": p.name,
                    "email": p.email,
                    "description": p.description,
                    "is_winner": p.is_winner
                }
                for p in participants
            ],
            "winners": [
                {
                    "id": w.id,
                    "name": w.name,
                    "email": w.email,
                    "description": w.description
                }
                for w in winners
            ]
        }

        return JSONResponse({"message": "추첨 상세 조회 성공", "data": response_data})

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(500, f"상세 조회 중 오류 발생: {str(e)}")


# ✅ 3️⃣ 랜덤 추첨 (기존)
@router.post("/random")
async def select_random_winners_api(
    request: Request,
    count: int = Query(..., description="추첨 인원 수"),
    db: Session = Depends(get_db),
):
    """랜덤 추첨 (API 버전)"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    try:
        winners = participant_service.select_random_winners(db, count)
        result = [
            {
                "id": w.id,
                "name": w.name,
                "email": w.email,
                "description": w.description,
                "created_at": w.created_at.isoformat() if w.created_at else None,
            }
            for w in winners
        ]
        return JSONResponse({"message": "랜덤 추첨 성공", "winners": result, "count": count})
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"랜덤 추첨 중 오류 발생: {str(e)}")


# ✅ 4️⃣ 추첨 결과 저장
@router.post("/save")
async def save_draw(request: Request, db: Session = Depends(get_db)):
    """추첨 결과 저장 (관리자용 API)"""
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    data = await request.json()
    result = draw_service.save_draw_result(db, data, user)
    return JSONResponse(result)


# ✅ 5️⃣ 추첨 기록 삭제
@router.delete("/{draw_id}/delete")
async def delete_draw(request: Request, draw_id: int, db: Session = Depends(get_db)):
    """추첨 기록 삭제 (관리자용 API)"""
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(403, "관리자 권한이 필요합니다.")
    result = draw_service.delete_draw(db, draw_id)
    return JSONResponse(result)
