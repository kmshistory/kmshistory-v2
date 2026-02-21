from fastapi import APIRouter, Request, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.notice_schema import NoticeResponse, NoticePageResponse, NoticeCategoryResponse
from app.services.notice_service import (
    admin_list_notices_service,
    admin_get_notice_service,
    admin_create_notice_service,
    admin_update_notice_service,
    admin_delete_notice_service,
    admin_list_categories_service,
    admin_create_category_service,
    admin_update_category_service,
    admin_delete_category_service,
    admin_upload_notice_image_service,
)
from app.utils.auth import get_current_user_from_cookie
from app.models import User

router = APIRouter(
    prefix="/api/admin",
    tags=["백오피스 공지사항(API)"],
)


# ----- 공지 목록/상세 -----

@router.get("/notices", response_model=NoticePageResponse)
async def admin_notice_list_api(
    request: Request,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    category_id: str | None = None,
    db: Session = Depends(get_db),
):
    page_res, _ = admin_list_notices_service(
        request=request, db=db, page=page, limit=limit, search=search, category_id=category_id
    )
    return page_res


@router.get("/notices/{notice_id}", response_model=NoticeResponse)
async def admin_notice_detail_api(
    request: Request, notice_id: int, db: Session = Depends(get_db)
):
    # 권한 체크를 위해 get 호출
    notice = admin_get_notice_service(request, db, notice_id)
    author = db.query(User).filter(User.id == notice.author_id).first()
    author_nickname = author.nickname if author else None
    category_name = getattr(notice.category, "name", None) if getattr(notice, "category", None) else None
    return NoticeResponse(
        id=notice.id,
        title=notice.title,
        content=notice.content,
        category_id=notice.category_id,
        publish_status=notice.publish_status,
        published_at=notice.published_at,
        author_id=notice.author_id,
        author_nickname=author_nickname,
        category_name=category_name,
        views=notice.views or 0,
        is_deleted=notice.is_deleted,
        created_at=notice.created_at,
        updated_at=notice.updated_at,
        deleted_at=notice.deleted_at,
    )


@router.post("/notices")
async def admin_notice_create_api(
    request: Request, db: Session = Depends(get_db)
):
    return await admin_create_notice_service(request, db)


@router.put("/notices/{notice_id}")
async def admin_notice_update_api(
    request: Request, notice_id: int, db: Session = Depends(get_db)
):
    return await admin_update_notice_service(request, db, notice_id)


@router.delete("/notices/{notice_id}")
async def admin_notice_delete_api(
    request: Request, notice_id: int, db: Session = Depends(get_db)
):
    return admin_delete_notice_service(request, db, notice_id)


# ----- 카테고리 CRUD -----

@router.get("/notice-categories", response_model=list[NoticeCategoryResponse])
async def admin_notice_categories_list_api(
    request: Request, db: Session = Depends(get_db)
):
    return admin_list_categories_service(request, db)


@router.post("/notice-categories")
async def admin_notice_category_create_api(
    request: Request, db: Session = Depends(get_db)
):
    return await admin_create_category_service(request, db)


@router.put("/notice-categories/{category_id}")
async def admin_notice_category_update_api(
    request: Request, category_id: int, db: Session = Depends(get_db)
):
    return await admin_update_category_service(request, db, category_id)


@router.delete("/notice-categories/{category_id}")
async def admin_notice_category_delete_api(
    request: Request, category_id: int, db: Session = Depends(get_db)
):
    return admin_delete_category_service(request, db, category_id)


# ----- 에디터 이미지 업로드 -----

@router.post("/notices/upload-image")
async def admin_notice_upload_image_api(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await admin_upload_notice_image_service(request, db, file)
