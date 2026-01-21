import os
import secrets
import asyncio
from datetime import datetime

from fastapi import HTTPException, UploadFile, status

from app.config import settings
from app.services.google_drive_service import google_drive_service

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


async def save_question_image(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="파일 이름이 유효하지 않습니다.")

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="허용되지 않은 이미지 형식입니다. (jpg, jpeg, png, gif, webp)",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="빈 파일은 업로드할 수 없습니다.")

    max_bytes = settings.MAX_QUIZ_IMAGE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"이미지 크기가 너무 큽니다. 최대 {settings.MAX_QUIZ_IMAGE_SIZE_MB}MB까지 가능합니다.",
        )

    mime_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(extension, "application/octet-stream")

    unique_name = f"{datetime.utcnow().strftime('%Y%m%d')}_{secrets.token_hex(8)}{extension}"

    # 1) Google Drive 업로드 시도
    drive_folder_id = settings.GOOGLE_DRIVE_FOLDER_ID_QUIZ_IMAGE
    if drive_folder_id:
        try:
            loop = asyncio.get_running_loop()

            def _upload():
                return google_drive_service.upload_file(
                    file_content=contents,
                    filename=unique_name,
                    mime_type=mime_type,
                    folder_id=drive_folder_id,
                )

            drive_result = await loop.run_in_executor(None, _upload)
            file_id = drive_result.get("file_id")
            if file_id:
                return f"https://lh3.googleusercontent.com/d/{file_id}"
            return drive_result.get("download_link") or drive_result.get("web_view_link")
        except Exception as e:
            print(f"⚠️ Google Drive 퀴즈 이미지 업로드 실패: {e}")
            # 실패 시 로컬 저장으로 폴백

    # 2) 로컬 저장 (기존 방식)
    today = datetime.utcnow()
    relative_dir = os.path.join(
        settings.QUIZ_IMAGE_UPLOAD_SUBDIR,
        today.strftime("%Y"),
        today.strftime("%m"),
    )
    absolute_dir = os.path.join(settings.MEDIA_ROOT, relative_dir)
    os.makedirs(absolute_dir, exist_ok=True)

    absolute_path = os.path.join(absolute_dir, unique_name)

    with open(absolute_path, "wb") as buffer:
        buffer.write(contents)

    return "/".join(
        [
            settings.MEDIA_URL.rstrip("/"),
            relative_dir.replace(os.sep, "/"),
            unique_name,
        ]
    )
