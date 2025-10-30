from sqlalchemy import Column, Integer, String, DateTime, func
from app.database.connection import Base

class UploadedFile(Base):
    """파일 업로드 모델"""
    __tablename__ = "upload_files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    original_filename = Column(String(255), nullable=False)
    saved_filename = Column(String(255), nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer, nullable=False)
    upload_type = Column(String(20), nullable=False)
    drive_file_id = Column(String(255))
    drive_web_view_link = Column(String(500))
    drive_download_link = Column(String(500))
    drive_created_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<UploadedFile(id={self.id}, filename='{self.original_filename}')>"