#!/usr/bin/env python3
"""
데이터베이스 초기화 스크립트
모든 테이블을 삭제하고 재생성합니다.
"""

import sys
import os

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
# 모든 모델 import (테이블 생성/삭제를 위해 필요)
from app.models import (
    UploadedFile, Participant, User, TempUser, Terms,
    DrawRecord, DrawParticipant, Notification,
    NoticeCategory, Notice, FAQCategory, FAQ
)
# Quiz 모델들도 import (누락되면 테이블 삭제 시 오류 발생)
from app.models.quiz import (
    Question, Choice, UserQuizHistory, QuizBundle,
    QuizBundleQuestion, UserQuizBundleProgress, Topic, QuestionTopicLink
)
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """데이터베이스 초기화 실행"""
    try:
        logger.info("=" * 60)
        logger.info("데이터베이스 초기화를 시작합니다...")
        logger.info("=" * 60)
        
        # 모든 테이블 삭제
        logger.info("\n[1단계] 기존 테이블 삭제 중...")
        Base.metadata.drop_all(bind=engine)
        logger.info("✓ 기존 테이블이 모두 삭제되었습니다.")
        
        # 모든 테이블 재생성
        logger.info("\n[2단계] 테이블 재생성 중...")
        Base.metadata.create_all(bind=engine)
        logger.info("✓ 테이블이 모두 생성되었습니다.")
        
        logger.info("\n" + "=" * 60)
        logger.info("데이터베이스 초기화가 완료되었습니다!")
        logger.info("=" * 60)
        
        # 생성된 테이블 목록 출력
        logger.info("\n생성된 테이블 목록:")
        for table_name in Base.metadata.tables.keys():
            logger.info(f"  - {table_name}")
            
    except Exception as e:
        logger.error(f"\n데이터베이스 초기화 중 오류 발생: {str(e)}")
        raise

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("⚠️  경고: 데이터베이스 초기화")
    print("=" * 60)
    print("이 작업은 데이터베이스의 모든 테이블을 삭제하고 재생성합니다.")
    print("모든 데이터가 영구적으로 삭제됩니다!")
    print("=" * 60)
    
    # 사용자 확인
    response = input("\n정말 진행하시겠습니까? (yes 입력 시 진행): ")
    if response.lower() == 'yes':
        init_database()
    else:
        print("\n초기화가 취소되었습니다.")

