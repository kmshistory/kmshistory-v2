import os
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models import UploadedFile
from app.services.google_drive_service import google_drive_service
from app.config import settings

class FileService:
    """파일 관련 서비스"""

    def get_file(self, db: Session, file_id: int) -> UploadedFile:
        file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
        if not file:
            raise HTTPException(404, "파일을 찾을 수 없습니다.")
        return file

    def list_files(self, db: Session):
        files = db.query(UploadedFile).order_by(UploadedFile.created_at.desc()).all()
        return [
            {
                "id": f.id,
                "original_filename": f.original_filename,
                "file_size": f.file_size,
                "upload_type": f.upload_type,
                "created_at": f.created_at,
                "has_drive_link": bool(f.drive_web_view_link)
            } for f in files
        ]

    def upload_file(self, db: Session, file: UploadFile):
        """Google Drive 업로드 후 DB 기록 / 실패 시 로컬 백업"""
        content = file.file.read()
        mime_type = self._get_mime_type(file.filename)

        try:
            drive_result = google_drive_service.upload_file(
                file_content=content,
                filename=file.filename,
                mime_type=mime_type,
                folder_id=settings.GOOGLE_DRIVE_FOLDER_ID_EXCEL
            )

            upload = UploadedFile(
                original_filename=file.filename,
                saved_filename=drive_result["filename"],
                file_size=drive_result["file_size"],
                upload_type="drive",
                drive_file_id=drive_result["file_id"],
                drive_web_view_link=drive_result["web_view_link"],
                drive_download_link=drive_result["download_link"]
            )
            db.add(upload)
            db.commit()
            db.refresh(upload)
            return upload

        except Exception as e:
            print(f"⚠️ Google Drive 업로드 실패: {e}")
            return self._save_local_backup(db, file, content)

    def _save_local_backup(self, db: Session, file: UploadFile, content: bytes):
        """Google Drive 업로드 실패 시 로컬 저장"""
        year, month, day = datetime.now().strftime("%Y %m %d").split()
        upload_dir = os.path.join("uploads", year, month, day)
        os.makedirs(upload_dir, exist_ok=True)

        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(content)

        upload = UploadedFile(
            original_filename=file.filename,
            saved_filename=file.filename,
            file_path=file_path,
            file_size=len(content),
            upload_type="local"
        )
        db.add(upload)
        db.commit()
        db.refresh(upload)
        return upload

    def _get_mime_type(self, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        return {
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".xls": "application/vnd.ms-excel",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".pdf": "application/pdf",
        }.get(ext, "application/octet-stream")

file_service = FileService()
