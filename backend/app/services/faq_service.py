from fastapi import HTTPException, Request, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime
from app.models import FAQ, FAQCategory, User
from app.schemas.faq_schema import (
    FAQResponse,
    FAQPageResponse,
    FAQCategoryResponse,
)
from app.schemas.common import PageResponse
from app.utils.auth import get_current_user_from_cookie

# -------------------------
# 내부 공통 유틸
# -------------------------

def _ensure_admin(request: Request, db: Session):
    user = get_current_user_from_cookie(request, db)
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user

def _to_faq_response(faq: FAQ) -> FAQResponse:
    return FAQResponse(
        id=faq.id,
        question=faq.question,
        answer=faq.answer,
        category_id=faq.category_id,
        category_name=getattr(getattr(faq, "category", None), "name", None),
        order=faq.order,
        is_active=faq.is_active,
        is_deleted=faq.is_deleted,
        created_at=faq.created_at,
        updated_at=faq.updated_at,
        deleted_at=faq.deleted_at,
    )

# -------------------------
# 관리자: 카테고리
# -------------------------

def admin_list_faq_categories_service(request: Request, db: Session) -> list[FAQCategoryResponse]:
    _ensure_admin(request, db)
    cats = db.query(FAQCategory).order_by(FAQCategory.order.asc()).all()
    return [
        FAQCategoryResponse(
            id=c.id, name=c.name, order=c.order, is_active=c.is_active,
            created_at=c.created_at, updated_at=c.updated_at
        )
        for c in cats
    ]

async def admin_create_faq_category_service(request: Request, db: Session):
    _ensure_admin(request, db)
    data = await request.json()

    name = (data.get("name") or "").strip()
    order = data.get("order", 0)
    is_active = data.get("is_active", True)

    if not name:
        raise HTTPException(status_code=400, detail="카테고리명은 필수입니다.")
    if len(name) > 50:
        raise HTTPException(status_code=400, detail="카테고리명은 50자 이하로 입력해주세요.")

    exists = db.query(FAQCategory).filter(FAQCategory.name == name).first()
    if exists:
        raise HTTPException(status_code=400, detail="이미 존재하는 카테고리명입니다.")

    current_count = db.query(FAQCategory).count()
    if current_count == 0 or order <= 0:
        adjusted_order = 1
    elif order > current_count + 1:
        adjusted_order = current_count + 1
    else:
        adjusted_order = order

    conflicts = db.query(FAQCategory).filter(FAQCategory.order >= adjusted_order).all()
    for c in conflicts:
        c.order += 1

    cat = FAQCategory(name=name, order=adjusted_order, is_active=is_active)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"message": "FAQ 카테고리가 생성되었습니다.", "category_id": cat.id}

async def admin_update_faq_category_service(request: Request, db: Session, category_id: int):
    _ensure_admin(request, db)
    data = await request.json()

    cat = db.query(FAQCategory).filter(FAQCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="FAQ 카테고리를 찾을 수 없습니다.")

    # name
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="카테고리명은 필수입니다.")
        if len(name) > 50:
            raise HTTPException(status_code=400, detail="카테고리명은 50자 이하로 입력해주세요.")
        dup = db.query(FAQCategory).filter(
            FAQCategory.name == name, FAQCategory.id != category_id
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="이미 존재하는 카테고리명입니다.")
        cat.name = name

    # order
    if "order" in data and data["order"] is not None:
        new_order = int(data["order"])
        old_order = cat.order
        if new_order != old_order:
            if new_order > old_order:
                db.query(FAQCategory).filter(
                    FAQCategory.order > old_order,
                    FAQCategory.order <= new_order,
                    FAQCategory.id != category_id
                ).update({FAQCategory.order: FAQCategory.order - 1}, synchronize_session=False)
            else:
                db.query(FAQCategory).filter(
                    FAQCategory.order >= new_order,
                    FAQCategory.order < old_order,
                    FAQCategory.id != category_id
                ).update({FAQCategory.order: FAQCategory.order + 1}, synchronize_session=False)
            cat.order = new_order

    # is_active
    if "is_active" in data:
        cat.is_active = bool(data["is_active"])

    db.commit()
    return {"message": "FAQ 카테고리가 수정되었습니다."}

def admin_delete_faq_category_service(request: Request, db: Session, category_id: int):
    _ensure_admin(request, db)
    cat = db.query(FAQCategory).filter(FAQCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="FAQ 카테고리를 찾을 수 없습니다.")

    faq_count = db.query(FAQ).filter(
        FAQ.category_id == category_id, FAQ.is_deleted == False
    ).count()
    if faq_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"이 카테고리를 사용하는 FAQ가 {faq_count}개 있습니다. 먼저 FAQ를 삭제하거나 다른 카테고리로 이동해주세요."
        )

    deleted_order = cat.order
    db.delete(cat)
    db.query(FAQCategory).filter(FAQCategory.order > deleted_order).update(
        {FAQCategory.order: FAQCategory.order - 1}
    )
    db.commit()
    return {"message": "FAQ 카테고리가 삭제되었습니다."}

# -------------------------
# 관리자: FAQ 목록/CRUD
# -------------------------

def admin_list_faqs_service(
    request: Request,
    db: Session,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    category_id: str | None = None,
):
    _ensure_admin(request, db)

    q = db.query(FAQ).outerjoin(FAQCategory, FAQ.category_id == FAQCategory.id)
    q = q.filter(FAQ.is_deleted == False)

    if search:
        q = q.filter(or_(FAQ.question.contains(search), FAQ.answer.contains(search)))

    if category_id and str(category_id).strip():
        try:
            cid = int(category_id)
            q = q.filter(FAQ.category_id == cid)
        except ValueError:
            pass

    q = q.order_by(FAQ.order.asc(), FAQ.created_at.desc())
    total = q.count()

    # 페이지 보정
    if page < 1:
        page = 1
    total_pages = (total + limit - 1) // limit
    if total_pages and page > total_pages:
        page = total_pages

    items = q.offset((page - 1) * limit).limit(limit).all()
    dto_items = [_to_faq_response(f) for f in items]

    categories = (
        db.query(FAQCategory)
        .filter(FAQCategory.is_active == True)
        .order_by(FAQCategory.order.asc())
        .all()
    )

    return PageResponse.create(dto_items, total, page, limit), categories

def admin_get_faq_service(request: Request, db: Session, faq_id: int) -> FAQ:
    _ensure_admin(request, db)
    faq = db.query(FAQ).filter(FAQ.id == faq_id, FAQ.is_deleted == False).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ를 찾을 수 없습니다.")
    return faq

async def admin_create_faq_service(request: Request, db: Session):
    _ensure_admin(request, db)
    data = await request.json()

    question = (data.get("question") or "").strip()
    answer = (data.get("answer") or "").strip()
    category_id = data.get("category_id")
    is_active = data.get("is_active", True)

    if not question:
        raise HTTPException(status_code=400, detail="질문은 필수입니다.")
    if len(question) > 300:
        raise HTTPException(status_code=400, detail="질문은 300자 이하로 입력해주세요.")
    if not answer:
        raise HTTPException(status_code=400, detail="답변은 필수입니다.")

    if category_id is not None and category_id != "":
        # 자동 order(카테고리별 max+1)
        last = db.query(FAQ).filter(
            FAQ.category_id == category_id, FAQ.is_deleted == False
        ).order_by(FAQ.order.desc()).first()
        auto_order = (last.order + 1) if last else 1
        cat_id = category_id
    else:
        last = db.query(FAQ).filter(
            FAQ.category_id.is_(None), FAQ.is_deleted == False
        ).order_by(FAQ.order.desc()).first()
        auto_order = (last.order + 1) if last else 1
        cat_id = None

    faq = FAQ(
        question=question,
        answer=answer,
        category_id=cat_id,
        order=auto_order,
        is_active=is_active,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return {"message": "FAQ가 생성되었습니다", "faq_id": faq.id}

async def admin_update_faq_service(request: Request, db: Session, faq_id: int):
    _ensure_admin(request, db)
    data = await request.json()

    faq = db.query(FAQ).filter(FAQ.id == faq_id, FAQ.is_deleted == False).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ를 찾을 수 없습니다.")

    if "question" in data:
        q = (data.get("question") or "").strip()
        if not q:
            raise HTTPException(status_code=400, detail="질문은 필수입니다.")
        if len(q) > 300:
            raise HTTPException(status_code=400, detail="질문은 300자 이하로 입력해주세요.")
        faq.question = q

    if "answer" in data:
        a = (data.get("answer") or "").strip()
        if not a:
            raise HTTPException(status_code=400, detail="답변은 필수입니다.")
        faq.answer = a

    if "category_id" in data:
        faq.category_id = data["category_id"] if data["category_id"] else None

    if "order" in data and data["order"] is not None:
        faq.order = int(data["order"])

    if "is_active" in data:
        faq.is_active = bool(data["is_active"])

    db.commit()
    return {"message": "FAQ가 수정되었습니다."}

def admin_delete_faq_service(request: Request, db: Session, faq_id: int):
    _ensure_admin(request, db)
    faq = db.query(FAQ).filter(FAQ.id == faq_id, FAQ.is_deleted == False).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ를 찾을 수 없습니다.")

    faq.is_deleted = True
    faq.deleted_at = datetime.now()
    db.commit()
    return {"message": "FAQ가 삭제되었습니다."}

def admin_toggle_faq_active_service(request: Request, db: Session, faq_id: int):
    _ensure_admin(request, db)
    faq = db.query(FAQ).filter(FAQ.id == faq_id, FAQ.is_deleted == False).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ를 찾을 수 없습니다.")

    faq.is_active = not faq.is_active
    db.commit()
    return {
        "message": f"FAQ가 {'공개' if faq.is_active else '비공개'}로 변경되었습니다.",
        "is_active": faq.is_active,
    }

# -------------------------
# 클라이언트: 목록/상세 (공개만)
# -------------------------

def client_list_faqs_service(
    db: Session,
    page: int = 1,
    limit: int = 5,
    search: str | None = None,
    category_id: str | None = None,
):
    q = db.query(FAQ).outerjoin(FAQCategory, FAQ.category_id == FAQCategory.id)
    q = q.filter(FAQ.is_deleted == False, FAQ.is_active == True)

    if search:
        q = q.filter(or_(FAQ.question.contains(search), FAQ.answer.contains(search)))

    if category_id and str(category_id).strip():
        try:
            cid = int(category_id)
            q = q.filter(FAQ.category_id == cid)
        except ValueError:
            pass

    q = q.order_by(FAQ.order.asc(), FAQ.created_at.desc())
    total = q.count()

    # 페이지 보정
    if page < 1:
        page = 1
    total_pages = (total + limit - 1) // limit
    if total_pages and page > total_pages:
        page = total_pages

    items = q.offset((page - 1) * limit).limit(limit).all()
    dto_items = [_to_faq_response(f) for f in items]

    categories = (
        db.query(FAQCategory)
        .filter(FAQCategory.is_active == True)
        .order_by(FAQCategory.order.asc())
        .all()
    )

    return PageResponse.create(dto_items, total, page, limit), categories

def client_get_faq_service(db: Session, faq_id: int) -> FAQ:
    faq = db.query(FAQ).filter(
        FAQ.id == faq_id, FAQ.is_deleted == False, FAQ.is_active == True
    ).first()
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ를 찾을 수 없습니다.")
    return faq
