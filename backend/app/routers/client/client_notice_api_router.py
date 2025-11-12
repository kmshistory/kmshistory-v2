from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.notice_schema import NoticeResponse, NoticePageResponse, NoticeCategoryResponse
from app.services.notice_service import (
    client_list_notices_service,
    client_get_notice_service,
)
from app.models import NoticeCategory

router = APIRouter(
    prefix="/api",
    tags=["클라이언트 공지사항(API)"],
)


@router.get("/notices", response_model=NoticePageResponse)
async def client_notice_list_api(
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    category_id: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        page_res, _ = client_list_notices_service(
            db=db, page=page, limit=limit, search=search, category_id=category_id
        )
        return page_res
    except Exception as e:
        import traceback
        error_msg = f"[ERROR] client_notice_list_api 에러: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"공지사항 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/notices/{notice_id}", response_model=NoticeResponse)
async def client_notice_detail_api(
    notice_id: int, db: Session = Depends(get_db)
):
    n = client_get_notice_service(db, notice_id)
    return NoticeResponse(
        id=n.id,
        title=n.title,
        content=n.content,
        category_id=n.category_id,
        publish_status=n.publish_status,
        published_at=n.published_at,
        author_id=n.author_id,
        author_nickname=getattr(getattr(n, "author", None), "nickname", None),
        category_name=getattr(getattr(n, "category", None), "name", None),
        views=n.views or 0,
        is_deleted=n.is_deleted,
        created_at=n.created_at,
        updated_at=n.updated_at,
        deleted_at=n.deleted_at,
    )


@router.get("/notice-categories", response_model=list[NoticeCategoryResponse])
async def client_notice_categories_api(
    db: Session = Depends(get_db)
):
    categories = (
        db.query(NoticeCategory)
        .filter(NoticeCategory.is_active == True)
        .order_by(NoticeCategory.order)
        .all()
    )
    return [
        NoticeCategoryResponse(
            id=c.id,
            name=c.name,
            order=c.order,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in categories
    ]
