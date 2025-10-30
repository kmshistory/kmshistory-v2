# app/services/notice_service.py
from __future__ import annotations

import os
from typing import List, Optional, Tuple, Dict, Any

from datetime import datetime, timezone, timedelta

from fastapi import HTTPException, UploadFile, Request
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session

from app.models import Notice, User, NoticeCategory
from app.schemas.common import PageResponse
from app.schemas import (
    NoticeResponse,
    NoticePageResponse,
    NoticeCreate,
    NoticeUpdate,
    NoticeCategoryResponse,
)
from app.utils import get_current_user_from_cookie


# ===== 공통 유틸 =====

KST = timezone(timedelta(hours=9))

def _ensure_admin(request: Request, db: Session) -> User:
    """
    쿠키에서 사용자 식별 & 관리자 권한 체크.
    """
    current_user = get_current_user_from_cookie(request, db)
    if not current_user or getattr(current_user, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return current_user

def _to_notice_response(n: Notice, author_nickname: Optional[str] = None, category_name: Optional[str] = None) -> NoticeResponse:
    """
    ORM Notice 객체를 NoticeResponse DTO로 변환.
    author_nickname / category_name 은 조인 결과가 있을 경우 덮어씀.
    """
    return NoticeResponse(
        id=n.id,
        title=n.title,
        content=n.content,
        category_id=n.category_id,
        publish_status=n.publish_status,
        published_at=n.published_at,
        author_id=n.author_id,
        author_nickname=author_nickname,
        category_name=category_name,
        views=n.views or 0,
        is_deleted=n.is_deleted,
        created_at=n.created_at,
        updated_at=n.updated_at,
        deleted_at=n.deleted_at,
    )

def _validate_publish_status(publish_status: str):
    if publish_status not in ["published", "scheduled", "private"]:
        raise HTTPException(status_code=400, detail="올바른 발행 상태를 선택해주세요.")

def _parse_published_at(value: Any) -> Optional[datetime]:
    """
    클라이언트에서 ISO 문자열로 올 수 있는 published_at을 파싱(KST 변환)해 반환.
    None 또는 datetime 이면 그대로 반환.
    """
    if value is None or isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            # 'Z'가 붙은 UTC 문자열을 datetime으로 변환 후 KST로
            utc_time = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return utc_time.astimezone(KST)
        except Exception:
            # ISO 미일치 시 한 번 더 시도
            try:
                dt = datetime.fromisoformat(value)
                # naive면 KST로 가정
                if dt.tzinfo is None:
                    return dt.replace(tzinfo=KST)
                return dt.astimezone(KST)
            except Exception:
                raise HTTPException(status_code=400, detail="올바른 날짜 형식을 입력해주세요.")
    raise HTTPException(status_code=400, detail="올바른 날짜 형식을 입력해주세요.")


# ===== 관리자: Notice =====

def admin_list_notices_service(
    request: Request,
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
) -> Tuple[NoticePageResponse, List[NoticeCategory]]:
    """
    관리자 공지 목록 (삭제 포함), 템플릿/Api 공용.
    반환: (PageResponse[NoticeResponse], 카테고리목록)
    """
    _ensure_admin(request, db)

    if page < 1:
        page = 1
    if limit < 1:
        limit = 10

    query = (
        db.query(Notice, User.nickname.label("author_nickname"), NoticeCategory.name.label("category_name"))
        .join(User, Notice.author_id == User.id)
        .outerjoin(NoticeCategory, Notice.category_id == NoticeCategory.id)
        .filter(Notice.is_deleted == False)  # 관리 페이지도 삭제된 건 안보는 요구였음(이전코드 유지)
    )

    if search:
        query = query.filter(
            or_(
                Notice.title.contains(search),
                Notice.content.contains(search),
                User.nickname.contains(search),
            )
        )

    if category_id and category_id.strip():
        try:
            query = query.filter(Notice.category_id == int(category_id))
        except ValueError:
            # 잘못된 category_id는 무시
            pass

    total = query.count()
    offset = (page - 1) * limit

    results = (
        query.order_by(Notice.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items: List[NoticeResponse] = []
    for n, author_nickname, category_name in results:
        # 시간대 표시는 템플릿에서 처리 가능하지만, DTO에 들어가는 값은 KST로 맞춰줌(이전 동작 유지)
        if n.published_at:
            n.published_at = n.published_at.astimezone(KST)
        items.append(_to_notice_response(n, author_nickname, category_name))

    page_obj = PageResponse.create(items=items, total=total, page=page, limit=limit)

    # 카테고리 목록(사이드필터)
    categories = (
        db.query(NoticeCategory)
        .filter(NoticeCategory.is_active == True)
        .order_by(NoticeCategory.order)
        .all()
    )
    return NoticePageResponse(**page_obj.dict()), categories


def admin_get_notice_service(request: Request, db: Session, notice_id: int) -> Notice:
    """
    관리자 공지 상세 (삭제되지 않은 항목만).
    템플릿 렌더링용으로 ORM 객체 반환(이전 코드 호환).
    """
    _ensure_admin(request, db)
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="공지사항을 찾을 수 없습니다.")
    if notice.published_at:
        notice.published_at = notice.published_at.astimezone(KST)
    return notice


async def admin_create_notice_service(request: Request, db: Session) -> Dict[str, Any]:
    """
    관리자 공지 생성 - request.json() 수동 검증 유지.
    """
    current_user = _ensure_admin(request, db)
    data = await request.json()

    title = data.get("title")
    content = data.get("content")
    category_id = data.get("category_id")
    publish_status = data.get("publish_status", "published")
    published_at = data.get("published_at")

    if not title:
        raise HTTPException(status_code=400, detail="제목은 필수입니다.")
    if len(title) > 100:
        raise HTTPException(status_code=400, detail="제목은 100자 이하로 입력해주세요.")
    if not content:
        raise HTTPException(status_code=400, detail="내용은 필수입니다.")

    if category_id:
        try:
            category_id = int(category_id)
        except Exception:
            raise HTTPException(status_code=400, detail="올바른 카테고리를 선택해주세요.")
    else:
        category_id = None

    _validate_publish_status(publish_status)
    published_at_dt = _parse_published_at(published_at) if published_at else None

    # 예약 검증
    if publish_status == "scheduled":
        if not published_at_dt:
            raise HTTPException(status_code=400, detail="예약 발행 시 발행일을 지정해야 합니다.")
        now_kst = datetime.now(KST)
        if published_at_dt <= now_kst:
            raise HTTPException(status_code=400, detail="예약 발행일은 현재 시간 이후여야 합니다.")

    notice = Notice(
        author_id=current_user.id,
        title=title,
        content=content,
        category_id=category_id,
        publish_status=publish_status,
        published_at=published_at_dt,
        first_published_at=datetime.utcnow() if publish_status == "published" else None,
    )

    try:
        db.add(notice)
        db.commit()
        db.refresh(notice)
        return {"message": "공지사항이 생성되었습니다.", "notice_id": notice.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"공지사항 생성 중 오류가 발생했습니다: {str(e)}")


async def admin_update_notice_service(request: Request, db: Session, notice_id: int) -> Dict[str, Any]:
    """
    관리자 공지 수정 - request.json() 수동 검증 유지.
    """
    _ensure_admin(request, db)
    data = await request.json()

    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="공지사항을 찾을 수 없습니다.")

    if "title" in data:
        if not data["title"]:
            raise HTTPException(status_code=400, detail="제목은 필수입니다.")
        if len(data["title"]) > 100:
            raise HTTPException(status_code=400, detail="제목은 100자 이하로 입력해주세요.")
        notice.title = data["title"]

    if "content" in data:
        if not data["content"]:
            raise HTTPException(status_code=400, detail="내용은 필수입니다.")
        notice.content = data["content"]

    if "category_id" in data:
        if not data["category_id"]:
            raise HTTPException(status_code=400, detail="카테고리는 필수입니다.")
        try:
            notice.category_id = int(data["category_id"])
        except Exception:
            raise HTTPException(status_code=400, detail="올바른 카테고리를 선택해주세요.")

    if "publish_status" in data:
        _validate_publish_status(data["publish_status"])
        notice.publish_status = data["publish_status"]

    if "published_at" in data:
        notice.published_at = _parse_published_at(data["published_at"]) if data["published_at"] else None

    # 예약발행 검증
    if notice.publish_status == "scheduled":
        if not notice.published_at:
            raise HTTPException(status_code=400, detail="예약 발행 시 발행일을 지정해야 합니다.")
        if notice.published_at <= datetime.now(KST):
            raise HTTPException(status_code=400, detail="예약 발행일은 현재 시간 이후여야 합니다.")

    # 최초 공개 전환시 최초 발행일 설정
    if notice.publish_status == "published" and not notice.first_published_at:
        notice.first_published_at = datetime.utcnow()

    notice.updated_at = func.now()

    try:
        db.commit()
        return {"message": "공지사항이 수정되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"공지사항 수정 중 오류가 발생했습니다: {str(e)}")


def admin_delete_notice_service(request: Request, db: Session, notice_id: int) -> Dict[str, Any]:
    """
    관리자 공지 삭제(Soft delete)
    """
    _ensure_admin(request, db)

    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="공지사항을 찾을 수 없습니다.")

    try:
        notice.is_deleted = True
        notice.deleted_at = func.now()
        db.commit()
        return {"message": "공지사항이 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"공지사항 삭제 중 오류가 발생했습니다: {str(e)}")


# ===== 관리자: Category =====

def admin_list_categories_service(request: Request, db: Session) -> List[NoticeCategoryResponse]:
    _ensure_admin(request, db)
    categories = db.query(NoticeCategory).order_by(NoticeCategory.order).all()
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

async def admin_create_category_service(request: Request, db: Session) -> Dict[str, Any]:
    _ensure_admin(request, db)
    data = await request.json()

    name = data.get("name")
    order = data.get("order", 0)

    if not name:
        raise HTTPException(status_code=400, detail="카테고리명은 필수입니다.")

    existing = db.query(NoticeCategory).filter(NoticeCategory.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 카테고리명입니다.")

    current_count = db.query(NoticeCategory).count()
    if current_count == 0 or not isinstance(order, int) or order <= 0:
        order = 1
    elif order > current_count + 1:
        order = current_count + 1

    try:
        # 뒤로 밀기
        db.query(NoticeCategory).filter(NoticeCategory.order >= order).update(
            {NoticeCategory.order: NoticeCategory.order + 1}, synchronize_session=False
        )

        category = NoticeCategory(name=name, order=order, is_active=True)
        db.add(category)
        db.commit()
        db.refresh(category)
        return {"message": "카테고리가 생성되었습니다.", "category_id": category.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"카테고리 생성 중 오류가 발생했습니다: {str(e)}")

async def admin_update_category_service(request: Request, db: Session, category_id: int) -> Dict[str, Any]:
    _ensure_admin(request, db)
    data = await request.json()

    category = db.query(NoticeCategory).filter(NoticeCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")

    try:
        if "name" in data and data["name"]:
            existing = db.query(NoticeCategory).filter(
                NoticeCategory.name == data["name"],
                NoticeCategory.id != category_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="이미 존재하는 카테고리명입니다.")
            category.name = data["name"]

        if "order" in data and isinstance(data["order"], int):
            new_order = data["order"]
            if new_order < 1:
                new_order = 1

            if new_order != category.order:
                if new_order > category.order:
                    # 사이 구간 앞으로 당김
                    db.query(NoticeCategory).filter(
                        NoticeCategory.order > category.order,
                        NoticeCategory.order <= new_order,
                        NoticeCategory.id != category_id
                    ).update({NoticeCategory.order: NoticeCategory.order - 1}, synchronize_session=False)
                else:
                    # 사이 구간 뒤로 밀기
                    db.query(NoticeCategory).filter(
                        NoticeCategory.order >= new_order,
                        NoticeCategory.order < category.order,
                        NoticeCategory.id != category_id
                    ).update({NoticeCategory.order: NoticeCategory.order + 1}, synchronize_session=False)
                category.order = new_order

        if "is_active" in data and isinstance(data["is_active"], bool):
            category.is_active = data["is_active"]

        category.updated_at = func.now()
        db.commit()
        return {"message": "카테고리가 수정되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"카테고리 수정 중 오류가 발생했습니다: {str(e)}")

def admin_delete_category_service(request: Request, db: Session, category_id: int) -> Dict[str, Any]:
    _ensure_admin(request, db)

    category = db.query(NoticeCategory).filter(NoticeCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")

    # 사용중인 공지 여부 확인
    notice_count = db.query(Notice).filter(
        Notice.category_id == category_id,
        Notice.is_deleted == False
    ).count()
    if notice_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"이 카테고리를 사용하는 공지사항이 {notice_count}개 있습니다. 먼저 공지사항을 다른 카테고리로 변경해주세요."
        )

    try:
        deleted_order = category.order
        db.delete(category)
        # 뒷번호 땡기기
        db.query(NoticeCategory).filter(NoticeCategory.order > deleted_order).update(
            {NoticeCategory.order: NoticeCategory.order - 1}, synchronize_session=False
        )
        db.commit()
        return {"message": "카테고리가 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"카테고리 삭제 중 오류가 발생했습니다: {str(e)}")


# ===== 클라이언트: Notice =====

def client_list_notices_service(
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
) -> Tuple[NoticePageResponse, List[NoticeCategory]]:
    """
    공개 공지 목록 (비공개 제외, 예약은 발행일 도달한 건만 포함)
    """
    if page < 1:
        page = 1
    if limit < 1:
        limit = 10

    now_kst = datetime.now(KST)

    query = (
        db.query(Notice, User.nickname.label("author_nickname"), NoticeCategory.name.label("category_name"))
        .join(User, Notice.author_id == User.id)
        .outerjoin(NoticeCategory, Notice.category_id == NoticeCategory.id)
        .filter(Notice.is_deleted == False)
        .filter(Notice.publish_status != "private")
        .filter(
            or_(
                and_(Notice.publish_status == "published"),
                and_(Notice.publish_status == "scheduled", Notice.published_at <= now_kst),
            )
        )
    )

    if search:
        query = query.filter(
            or_(Notice.title.contains(search), Notice.content.contains(search))
        )

    if category_id and category_id.strip():
        try:
            query = query.filter(Notice.category_id == int(category_id))
        except ValueError:
            pass

    total = query.count()
    offset = (page - 1) * limit

    results = (
        query.order_by(func.coalesce(Notice.published_at, Notice.created_at).desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items: List[NoticeResponse] = []
    for n, author_nickname, category_name in results:
        if n.published_at:
            n.published_at = n.published_at.astimezone(KST)
        items.append(_to_notice_response(n, author_nickname, category_name))

    page_obj = PageResponse.create(items=items, total=total, page=page, limit=limit)

    categories = (
        db.query(NoticeCategory)
        .filter(NoticeCategory.is_active == True)
        .order_by(NoticeCategory.order)
        .all()
    )
    return NoticePageResponse(**page_obj.dict()), categories


def client_get_notice_service(db: Session, notice_id: int) -> Notice:
    """
    공개 공지 상세 (private 제외, scheduled는 발행일 도달해야 함)
    템플릿 렌더링을 위해 ORM 반환 (이전 코드 호환) + 조회수 증가.
    """
    notice = db.query(Notice).filter(
        Notice.id == notice_id,
        Notice.is_deleted == False
    ).first()

    if not notice:
        raise HTTPException(status_code=404, detail="공지사항을 찾을 수 없습니다.")

    if notice.publish_status == "private":
        raise HTTPException(status_code=404, detail="공지사항을 찾을 수 없습니다.")

    if notice.publish_status == "scheduled":
        now_kst = datetime.now(KST)
        if not notice.published_at or notice.published_at > now_kst:
            raise HTTPException(status_code=404, detail="공지사항을 찾을 수 없습니다.")

    try:
        notice.views = (notice.views or 0) + 1
        db.commit()
    except Exception:
        db.rollback()
        # 조회수 실패는 주요 오류로 보지 않음

    return notice


# ===== 이미지 업로드 =====

async def admin_upload_notice_image_service(
    request: Request,
    db: Session,
    file: UploadFile
) -> Dict[str, Any]:
    """
    Toast UI 에디터 이미지 업로드 (Google Drive)
    """
    _ensure_admin(request, db)

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다.")

    file_content = await file.read()

    now = datetime.now()
    file_extension = os.path.splitext(file.filename)[1]
    original_name = os.path.splitext(file.filename)[0]
    time_stamp = now.strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{original_name}_{time_stamp}{file_extension}"

    mime_type = file.content_type

    try:
        # 지연 import (서비스가 선택적일 수 있으므로)
        from app.services.google_drive_service import google_drive_service
        from app.config import settings

        if not google_drive_service or not google_drive_service.service:
            raise HTTPException(status_code=503, detail="Google Drive 서비스가 인증되지 않았습니다.")

        drive_result = google_drive_service.upload_file(
            file_content=file_content,
            filename=unique_filename,
            mime_type=mime_type,
            folder_id=settings.GOOGLE_DRIVE_FOLDER_ID_NOTICE_IMAGE
        )

        file_id = drive_result.get("file_id")
        file_url = f"https://lh3.googleusercontent.com/d/{file_id}"

        return {
            "url": file_url,
            "filename": unique_filename,
            "size": drive_result.get("file_size"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이미지 업로드 중 오류가 발생했습니다: {str(e)}")
