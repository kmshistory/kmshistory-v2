#!/usr/bin/env python3
"""
회원탈퇴 후 7일이 지난 사용자들을 완전히 삭제하는 스크립트
매일 실행되도록 crontab에 등록하거나 시스템 서비스로 실행
"""

import sys
import os
from datetime import datetime, timedelta

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scripts/cleanup_deleted_users.log'),
        logging.StreamHandler()
    ]
)

def cleanup_deleted_users():
    """7일이 지난 탈퇴 사용자들을 완전히 삭제"""
    try:
        db = next(get_db())
        
        # 7일 전 시간 계산
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        # 7일이 지난 탈퇴 사용자 조회
        users_to_delete = db.query(User).filter(
            User.deleted_at.isnot(None),
            User.deleted_at <= seven_days_ago
        ).all()
        
        if not users_to_delete:
            logging.info("삭제할 사용자가 없습니다.")
            return
        
        deleted_count = 0
        for user in users_to_delete:
            try:
                logging.info(f"사용자 삭제 중: {user.email} (닉네임: {user.nickname})")
                
                # 사용자 완전 삭제
                db.delete(user)
                deleted_count += 1
                
                logging.info(f"사용자 삭제 완료: {user.email}")
                
            except Exception as e:
                logging.error(f"사용자 삭제 실패: {user.email}, 오류: {str(e)}")
                continue
        
        # 변경사항 커밋
        db.commit()
        
        logging.info(f"총 {deleted_count}명의 사용자가 완전히 삭제되었습니다.")
        
    except Exception as e:
        logging.error(f"사용자 정리 중 오류 발생: {str(e)}")
        if 'db' in locals():
            db.rollback()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    logging.info("=== 회원탈퇴 사용자 정리 작업 시작 ===")
    cleanup_deleted_users()
    logging.info("=== 회원탈퇴 사용자 정리 작업 완료 ===")
