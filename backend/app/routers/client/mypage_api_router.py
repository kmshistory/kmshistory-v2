# app/routers/mypage_api_router.py
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models import User
from app.utils.auth import get_current_user_from_cookie
from app.services import mypage_service

router = APIRouter(prefix="/api/mypage", tags=["MyPage:API"])

# 닉네임 수정
@router.post("/update")
async def update_user_info(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    result = await mypage_service.update_user_info_service(request, db, user)
    return JSONResponse(result)

# 현재 비밀번호 검증
@router.post("/verify-password")
async def verify_current_password(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    result = await mypage_service.verify_current_password_service(request, db, user)
    return JSONResponse(result)

# 비밀번호 변경
@router.post("/change-password")
async def change_password(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    result = await mypage_service.change_user_password_service(request, db, user)

    # 비밀번호 변경 후 로그아웃 쿠키 반영
    headers = result.get("headers", {})
    response = JSONResponse({"message": result["message"], "logout": True})
    for k, v in headers.items():
        response.headers[k] = v

    return response

# 회원탈퇴 (자동 로그아웃 포함)
@router.post("/withdraw")
async def withdraw_user(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    result = await mypage_service.withdraw_user_service(request, db, user)

    # 쿠키 제거 헤더 포함 응답
    headers = result.get("headers", {})
    response = JSONResponse({"message": result["message"], "logout": True})
    for k, v in headers.items():
        response.headers[k] = v

    return response

@router.get("/quiz/bundles")
def mypage_bundle_history(
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user_from_cookie(request, db)
    data = mypage_service.get_bundle_history(db, user.id)
    return JSONResponse(content=jsonable_encoder(data))


@router.get("/quiz/wrong-answers")
def mypage_wrong_answers(
    request: Request,
    bundle_id: Optional[int] = Query(None),
    topic_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    user = get_current_user_from_cookie(request, db)
    data = mypage_service.get_wrong_answers(db, user.id, bundle_id=bundle_id, topic_id=topic_id)
    return JSONResponse(content=jsonable_encoder(data))


@router.get("/quiz/stats")
def mypage_quiz_stats(
    request: Request,
    db: Session = Depends(get_db),
):
    user = get_current_user_from_cookie(request, db)
    data = mypage_service.get_user_quiz_stats(db, user.id)
    return JSONResponse(content=jsonable_encoder(data))
