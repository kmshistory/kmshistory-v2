from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.faq_schema import FAQResponse, FAQPageResponse, FAQCategoryResponse
from app.services.faq_service import (
    client_list_faqs_service,
    client_get_faq_service,
)
from app.models import FAQCategory

router = APIRouter(
    prefix="/api",
    tags=["클라이언트 FAQ(API)"],
)

@router.get("/faq", response_model=FAQPageResponse)
async def client_faq_list_api(
    page: int = 1,
    limit: int = 5,
    search: str | None = None,
    category_id: str | None = None,
    db: Session = Depends(get_db),
):
    page_res, _ = client_list_faqs_service(
        db=db, page=page, limit=limit, search=search, category_id=category_id
    )
    return page_res

@router.get("/faq/{faq_id}", response_model=FAQResponse)
async def client_faq_detail_api(
    faq_id: int, db: Session = Depends(get_db)
):
    faq = client_get_faq_service(db, faq_id)
    from app.services.faq_service import _to_faq_response
    return _to_faq_response(faq)

@router.get("/faq-categories", response_model=list[FAQCategoryResponse])
async def client_faq_categories_api(
    db: Session = Depends(get_db)
):
    cats = (
        db.query(FAQCategory)
        .filter(FAQCategory.is_active == True)
        .order_by(FAQCategory.order.asc())
        .all()
    )
    return [
        FAQCategoryResponse(
            id=c.id, name=c.name, order=c.order, is_active=c.is_active,
            created_at=c.created_at, updated_at=c.updated_at
        )
        for c in cats
    ]
