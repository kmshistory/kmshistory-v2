from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.faq_schema import FAQResponse, FAQPageResponse, FAQCategoryResponse
from app.services.faq_service import (
    admin_list_faq_categories_service,
    admin_create_faq_category_service,
    admin_update_faq_category_service,
    admin_delete_faq_category_service,
    admin_list_faqs_service,
    admin_get_faq_service,
    admin_create_faq_service,
    admin_update_faq_service,
    admin_delete_faq_service,
    admin_toggle_faq_active_service,
)

router = APIRouter(
    prefix="/api/admin",
    tags=["백오피스 FAQ(API)"],
)

# ----- 카테고리 -----

@router.get("/faq-categories", response_model=list[FAQCategoryResponse])
async def admin_faq_categories_api(
    request: Request, db: Session = Depends(get_db)
):
    return admin_list_faq_categories_service(request, db)

@router.post("/faq-categories")
async def admin_faq_category_create_api(
    request: Request, db: Session = Depends(get_db)
):
    return await admin_create_faq_category_service(request, db)

@router.put("/faq-categories/{category_id}")
async def admin_faq_category_update_api(
    request: Request, category_id: int, db: Session = Depends(get_db)
):
    return await admin_update_faq_category_service(request, db, category_id)

@router.delete("/faq-categories/{category_id}")
async def admin_faq_category_delete_api(
    request: Request, category_id: int, db: Session = Depends(get_db)
):
    return admin_delete_faq_category_service(request, db, category_id)

# ----- FAQ -----

@router.get("/faq", response_model=FAQPageResponse)
async def admin_faq_list_api(
    request: Request,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    category_id: str | None = None,
    db: Session = Depends(get_db),
):
    page_res, _ = admin_list_faqs_service(request, db, page, limit, search, category_id)
    return page_res

@router.get("/faq/{faq_id}", response_model=FAQResponse)
async def admin_faq_detail_api(
    request: Request, faq_id: int, db: Session = Depends(get_db)
):
    faq = admin_get_faq_service(request, db, faq_id)
    from app.services.faq_service import _to_faq_response
    return _to_faq_response(faq)

@router.post("/faq")
async def admin_faq_create_api(
    request: Request, db: Session = Depends(get_db)
):
    return await admin_create_faq_service(request, db)

@router.put("/faq/{faq_id}")
async def admin_faq_update_api(
    request: Request, faq_id: int, db: Session = Depends(get_db)
):
    return await admin_update_faq_service(request, db, faq_id)

@router.delete("/faq/{faq_id}")
async def admin_faq_delete_api(
    request: Request, faq_id: int, db: Session = Depends(get_db)
):
    return admin_delete_faq_service(request, db, faq_id)

@router.patch("/faq/{faq_id}/toggle-active")
async def admin_faq_toggle_active_api(
    request: Request, faq_id: int, db: Session = Depends(get_db)
):
    return admin_toggle_faq_active_service(request, db, faq_id)
