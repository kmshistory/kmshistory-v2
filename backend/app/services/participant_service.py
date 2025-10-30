from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import Participant, UploadedFile
from app.schemas import ParticipantCreate
from fastapi import UploadFile, HTTPException
import openpyxl
import random
import os
from datetime import datetime
from typing import List, Tuple, Optional


class ParticipantService:
    """대상자 관리 서비스"""

    # -------------------------------
    # 기본 조회
    # -------------------------------
    def get_all_participants(self, db: Session, limit: int = 10, offset: int = 0) -> Tuple[List[Participant], int]:
        participants = db.query(Participant).offset(offset).limit(limit).all()
        total_count = db.query(Participant).count()
        return participants, total_count

    def get_all_participants_for_selection(self, db: Session) -> List[Participant]:
        """랜덤 선정을 위한 전체 대상자 조회"""
        return db.query(Participant).all()

    def search_participants(self, db: Session, name: str = None, description: str = None,
                            email: str = None, limit: int = 10, offset: int = 0) -> Tuple[List[Participant], int]:
        """검색"""
        query = db.query(Participant)
        conditions = []
        if name:
            conditions.append(Participant.name.like(f"%{name}%"))
        if description:
            conditions.append(Participant.description.like(f"%{description}%"))
        if email:
            conditions.append(Participant.email.like(f"%{email}%"))
        if conditions:
            query = query.filter(and_(*conditions))
        total_count = query.count()
        participants = query.offset(offset).limit(limit).all()
        return participants, total_count

    def get_participant_by_id(self, db: Session, participant_id: int) -> Optional[Participant]:
        participant = db.query(Participant).filter(Participant.id == participant_id).first()
        if not participant:
            raise HTTPException(404, "대상자를 찾을 수 없습니다.")
        return participant

    # -------------------------------
    # CRUD
    # -------------------------------
    def create_participant(self, db: Session, participant_data: ParticipantCreate) -> Participant:
        participant = Participant(
            name=participant_data.name,
            email=participant_data.email,
            description=participant_data.description
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)
        return participant

    def update_participant(self, db: Session, participant_id: int, participant_data: ParticipantCreate) -> Participant:
        participant = self.get_participant_by_id(db, participant_id)
        participant.name = participant_data.name
        participant.email = participant_data.email
        participant.description = participant_data.description
        db.commit()
        db.refresh(participant)
        return participant

    def delete_participant(self, db: Session, participant_id: int) -> bool:
        participant = self.get_participant_by_id(db, participant_id)
        db.delete(participant)
        db.commit()
        return True

    # -------------------------------
    # 엑셀 업로드
    # -------------------------------
    def upload_excel_file(self, db: Session, file: UploadFile, replace_all: bool = False) -> str:
        """엑셀 업로드 및 Google Drive 연동"""
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(400, "엑셀 파일만 업로드 가능합니다.")

        saved_file = self._save_uploaded_file(db, file, replace_all)
        participants_data = self._parse_excel_file(file)
        if not participants_data:
            raise HTTPException(400, "유효한 데이터가 없습니다.")

        if replace_all:
            db.query(Participant).delete()
            db.commit()

        for data in participants_data:
            participant = Participant(
                name=data['name'],
                email=data['email'],
                description=data['description'],
                upload_file_id=saved_file.id
            )
            db.add(participant)
        db.commit()

        msg = f"'{file.filename}' 업로드 완료 ({len(participants_data)}명)"
        msg += " — 기존 데이터 교체됨" if replace_all else " — 기존 데이터에 추가됨"
        return msg

    def _save_uploaded_file(self, db: Session, file: UploadFile, replace_all: bool) -> UploadedFile:
        """Google Drive 업로드 시도 후 로컬 백업"""
        from app.services.google_drive_service import google_drive_service
        from app.config import settings

        now = datetime.now()
        name, ext = os.path.splitext(file.filename)
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        unique_name = f"{name}_{timestamp}{ext}"
        mime_type = self._get_mime_type(ext)

        file_content = file.file.read()
        file.file.seek(0)
        file_size = len(file_content)

        try:
            drive_result = google_drive_service.upload_file(
                file_content=file_content,
                filename=unique_name,
                mime_type=mime_type,
                folder_id=settings.GOOGLE_DRIVE_FOLDER_ID_EXCEL
            )

            upload_file = UploadedFile(
                original_filename=file.filename,
                saved_filename=unique_name,
                file_size=file_size,
                upload_type="replace" if replace_all else "add",
                drive_file_id=drive_result["file_id"],
                drive_web_view_link=drive_result["web_view_link"],
                drive_download_link=drive_result["download_link"],
                drive_created_time=datetime.now()
            )
            db.add(upload_file)
            db.commit()
            db.refresh(upload_file)
            return upload_file
        except Exception as e:
            # 로컬 백업 경로 생성
            year, month, day = now.strftime("%Y"), now.strftime("%m"), now.strftime("%d")
            backup_dir = os.path.join("uploads", year, month, day)
            os.makedirs(backup_dir, exist_ok=True)
            local_path = os.path.join(backup_dir, unique_name)

            with open(local_path, "wb") as f:
                f.write(file_content)

            upload_file = UploadedFile(
                original_filename=file.filename,
                saved_filename=unique_name,
                file_path=local_path,
                file_size=file_size,
                upload_type="replace" if replace_all else "add"
            )
            db.add(upload_file)
            db.commit()
            db.refresh(upload_file)
            return upload_file

    def _get_mime_type(self, ext: str) -> str:
        return {
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".xls": "application/vnd.ms-excel",
            ".csv": "text/csv",
            ".pdf": "application/pdf",
        }.get(ext.lower(), "application/octet-stream")

    def _parse_excel_file(self, file: UploadFile) -> List[dict]:
        """엑셀 파싱"""
        from io import BytesIO
        wb = openpyxl.load_workbook(BytesIO(file.file.read()))
        file.file.seek(0)
        sheet = wb.active
        participants = []
        for row in sheet.iter_rows(min_row=2, values_only=True):
            if not row or not row[0]:
                continue
            name = str(row[0]).strip()
            email = str(row[1]).strip()
            description = str(row[2]).strip() if len(row) > 2 else None
            if not name or not email:
                continue
            participants.append({"name": name, "email": email, "description": description})
        return participants

    def select_random_winners(self, db: Session, count: int) -> List[Participant]:
        """랜덤 당첨자 선정"""
        all_p = self.get_all_participants_for_selection(db)
        if len(all_p) < count:
            raise HTTPException(400, f"대상자 수({len(all_p)})가 선정 수({count})보다 적습니다.")
        return random.sample(all_p, count)

    def bulk_delete_participants(self, db: Session, ids: List[int]) -> int:
        """일괄 삭제"""
        if not ids:
            return 0
        existing = db.query(Participant).filter(Participant.id.in_(ids)).all()
        if not existing:
            return 0
        deleted = db.query(Participant).filter(Participant.id.in_(ids)).delete(synchronize_session=False)
        db.commit()
        return deleted


# ✅ 인스턴스화 (DI 용)
participant_service = ParticipantService()
