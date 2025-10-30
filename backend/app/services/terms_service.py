from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models import Terms
from datetime import datetime
from app.utils import get_default_content

class TermsService:
    """약관 관련 비즈니스 로직"""

    def get_terms(self, db: Session, key: str):
        """특정 약관 조회"""
        terms = db.query(Terms).filter(Terms.key == key, Terms.is_active == True).first()
        if not terms:
            return {
                "title": self.get_default_title(key),
                "content": get_default_content(key),
                "created_at": None,
                "updated_at": None
            }
        return terms

    def create_or_update_terms(self, db: Session, key: str, title: str, content: str):
        """약관 생성/수정"""
        terms = db.query(Terms).filter(Terms.key == key).first()
        if terms:
            terms.title = title
            terms.content = content
            terms.updated_at = func.now()
        else:
            terms = Terms(key=key, title=title, content=content, is_active=True)
            db.add(terms)
        db.commit()
        db.refresh(terms)
        return {"message": f"{key} 약관이 저장되었습니다."}

    def list_terms(self, db: Session):
        """전체 약관 목록"""
        terms = db.query(Terms).order_by(Terms.created_at.desc()).all()
        total = len(terms)
        return terms, total

    def get_default_title(self, key: str):
        mapping = {
            "terms": "서비스 이용약관",
            "privacy": "개인정보처리방침",
            "collection": "개인정보 수집 및 이용동의",
            "marketing": "마케팅정보 수집 및 이용동의"
        }
        return mapping.get(key, key)

terms_service = TermsService()
