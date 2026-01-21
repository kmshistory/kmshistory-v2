from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.common import PageResponse

class UploadedFileBase(BaseModel):
    """기본 파일 스키마 (공통 필드)"""
    original_filename: str = Field(..., description="업로드된 원본 파일명")
    file_size: int = Field(..., description="파일 크기 (byte)")
    upload_type: str = Field(..., description="업로드 타입 (drive/local)")

class UploadedFileCreate(BaseModel):
    """파일 생성 스키마"""
    original_filename: str = Field(..., description="업로드된 원본 파일명")
    file_size: int = Field(..., description="파일 크기 (byte)")
    upload_type: str = Field(..., description="업로드 타입 (drive/local)")
    saved_filename: Optional[str] = Field(None, description="서버에 저장된 파일명")
    file_path: Optional[str] = Field(None, description="로컬 저장 경로")
    drive_file_id: Optional[str] = Field(None, description="Google Drive 파일 ID")

class UploadedFileUpdate(BaseModel):
    """파일 수정 스키마"""
    original_filename: Optional[str] = Field(None, description="업로드된 원본 파일명")
    saved_filename: Optional[str] = Field(None, description="서버에 저장된 파일명")
    file_size: Optional[int] = Field(None, description="파일 크기 (byte)")
    upload_type: Optional[str] = Field(None, description="업로드 타입 (drive/local)")

class UploadedFileResponse(UploadedFileBase):
    """파일 응답 스키마"""
    id: int
    saved_filename: Optional[str] = Field(None, description="서버에 저장된 파일명")
    created_at: Optional[datetime] = Field(None, description="생성일시")
    file_path: Optional[str] = Field(None, description="로컬 저장 경로")
    drive_file_id: Optional[str] = Field(None, description="Google Drive 파일 ID")
    drive_web_view_link: Optional[str] = Field(None, description="Google Drive 보기 링크")
    drive_download_link: Optional[str] = Field(None, description="Google Drive 다운로드 링크")

    class Config:
        from_attributes = True

class UploadedFileDetail(UploadedFileResponse):
    """단일 파일 상세 스키마"""
    file_path: Optional[str] = Field(None, description="로컬 저장 경로 (로컬 업로드 시)")
    drive_file_id: Optional[str] = Field(None, description="Google Drive 파일 ID")
    drive_web_view_link: Optional[str] = Field(None, description="Google Drive 보기 링크")
    drive_download_link: Optional[str] = Field(None, description="Google Drive 다운로드 링크")
    drive_created_time: Optional[datetime] = Field(None, description="Google Drive 업로드 시간")


class UploadedFileListResponse(BaseModel):
    """파일 목록 응답"""
    files: List[UploadedFileBase]
    total_count: int = Field(..., description="총 파일 수")

    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """파일 업로드 후 결과 응답"""
    message: str = Field(..., description="결과 메시지")
    file_id: Optional[int] = Field(None, description="업로드된 파일 ID")
    filename: Optional[str] = Field(None, description="파일명")
    drive_link: Optional[str] = Field(None, description="Google Drive 보기 링크")
    upload_type: Optional[str] = Field(None, description="업로드 타입 (drive/local)")

    class Config:
        from_attributes = True

class UploadedFilePageResponse(PageResponse[UploadedFileResponse]):
    """파일 페이징 응답"""
    pass
