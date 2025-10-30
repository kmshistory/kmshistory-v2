from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.templates import templates
from app.utils.auth import get_current_user_from_cookie
from app.services.file_service import file_service

router = APIRouter(tags=["Admin:Files:Templates"])

@router.get("/admin/files", response_class=HTMLResponse)
async def admin_files_page(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        return RedirectResponse(url="/admin-required", status_code=303)
    files = file_service.list_files(db)
    return templates.TemplateResponse(
        "backoffice/files/file_list.html",
        {"request": request, "user": user, "files": files, "title": "파일 관리"}
    )
