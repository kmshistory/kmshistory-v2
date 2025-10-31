from fastapi import (
    APIRouter, Request, Depends, UploadFile, File, HTTPException
)
from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.auth import get_current_user_from_cookie
from app.services.file_service import file_service
from app.schemas.file_schema import (
    UploadedFileListResponse, UploadedFileDetail, FileUploadResponse
)

router = APIRouter(prefix="/api/files", tags=["Files"])


# ✅ 파일 목록 조회 (관리자 전용)
@router.get("", response_model=UploadedFileListResponse)
async def list_uploaded_files(request: Request, db: Session = Depends(get_db)):
    """파일 목록 조회 (관리자용)"""
    current_user = get_current_user_from_cookie(request, db)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    files = file_service.list_files(db)
    return {"files": files, "total_count": len(files)}


# ✅ 단일 파일 상세 조회
@router.get("/{file_id}", response_model=UploadedFileDetail)
async def get_file_detail(file_id: int, db: Session = Depends(get_db)):
    """단일 파일 상세 정보 조회"""
    file = file_service.get_file(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    return file


# ✅ Google Drive 뷰 링크 or 로컬 파일 경로 반환
@router.get("/{file_id}/view")
async def get_file_view_link(file_id: int, db: Session = Depends(get_db)):
    """Google Drive 뷰 링크 또는 로컬 파일 경로 반환"""
    file = file_service.get_file(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")

    if file.drive_web_view_link:
        return {"file_id": file.id, "view_link": file.drive_web_view_link}
    elif file.file_path:
        return {"file_id": file.id, "local_path": file.file_path}
    else:
        raise HTTPException(status_code=404, detail="파일 경로를 찾을 수 없습니다.")


# ✅ 파일 다운로드 (Drive or Local)
@router.get("/{file_id}/download")
async def download_file(file_id: int, db: Session = Depends(get_db)):
    """파일 다운로드"""
    file = file_service.get_file(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")

    # Google Drive 다운로드 링크로 리디렉션
    if file.drive_download_link:
        return RedirectResponse(url=file.drive_download_link)

    # 로컬 파일 다운로드
    elif file.file_path:
        return FileResponse(
            path=file.file_path,
            filename=file.original_filename,
            media_type="application/octet-stream"
        )

    raise HTTPException(status_code=404, detail="다운로드 가능한 파일이 없습니다.")


# ✅ 파일 업로드 (관리자 전용)
@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """파일 업로드 (Google Drive or Local)"""
    current_user = get_current_user_from_cookie(request, db)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")

    uploaded_file = file_service.upload_file(db, file)

    return {
        "message": "파일 업로드 완료",
        "file_id": uploaded_file.id,
        "filename": uploaded_file.original_filename,
        "drive_link": uploaded_file.drive_web_view_link,
        "upload_type": uploaded_file.upload_type,
    }
