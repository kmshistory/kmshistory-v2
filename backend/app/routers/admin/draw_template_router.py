# app/routers/draw_template_router.py
from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import draw_service, participant_service
from app.utils.auth import get_current_user_from_cookie
from app.templates import templates

router = APIRouter(tags=["Admin:Draw:Templates"])

@router.get("/draw", response_class=HTMLResponse)
async def draw_page(request: Request, db: Session = Depends(get_db)):
    """당첨자 추첨 페이지"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    # 전체 대상자 수 표시
    all_participants = participant_service.get_all_participants_for_selection(db)
    total_count = len(all_participants)

    return templates.TemplateResponse(
        "client/subscribers/random_selection.html",
        {
            "request": request,
            "total_count": total_count,
            "title": "당첨자 추첨",
        },
    )


@router.post("/draw/result", response_class=HTMLResponse)
async def draw_result_page(
    request: Request,
    count: int = Form(..., description="추첨 인원 수"),
    db: Session = Depends(get_db)
):
    """랜덤 추첨 결과 페이지"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    try:
        winners = participant_service.select_random_winners(db, count)
        winners_data = [
            {
                "name": w.name,
                "email": w.email,
                "description": w.description,
                "created_at": w.created_at.strftime("%Y-%m-%d %H:%M") if w.created_at else "",
            }
            for w in winners
        ]
        total = len(participant_service.get_all_participants_for_selection(db))

        return templates.TemplateResponse(
            "client/subscribers/winners.html",
            {
                "request": request,
                "winners": winners_data,
                "count": count,
                "total_participants": total,
                "title": "당첨자 발표",
            },
        )
    except Exception as e:
        return RedirectResponse(url=f"/draw?error={str(e)}", status_code=303)

@router.get("/admin/draw", response_class=HTMLResponse)
async def draw_list_page(request: Request, page: int = 1, search: str | None = None, db: Session = Depends(get_db)):
    """관리자 - 추첨 목록 페이지"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    limit = 10
    records, total = draw_service.list_draw_records(db, search, page, limit)
    total_pages = (total + limit - 1) // limit

    return templates.TemplateResponse(
        "backoffice/draw/draw_list.html",
        {
            "request": request,
            "user": current,
            "records": records,
            "search": search,
            "total": total,
            "total_pages": total_pages,
            "current_page": page,
            "title": "추첨 관리",
        },
    )


@router.get("/admin/draw/{draw_id}", response_class=HTMLResponse)
async def draw_detail_page(request: Request, draw_id: int, db: Session = Depends(get_db)):
    """관리자 - 추첨 상세 페이지"""
    current = get_current_user_from_cookie(request, db)
    if current.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)

    draw, participants = draw_service.get_draw_detail(db, draw_id)
    winners = [p for p in participants if p.is_winner]

    return templates.TemplateResponse(
        "backoffice/draw/draw_detail.html",
        {
            "request": request,
            "user": current,
            "draw": draw,
            "participants": participants,
            "winners": winners,
            "title": f"추첨 상세 - {draw.title}",
        },
    )
