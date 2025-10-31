#!/usr/bin/env python3
"""
Google Drive API 연결 테스트 스크립트
"""

import sys
import os

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_config():
    """설정 확인"""
    logger.info("=== Google Drive API 설정 확인 ===")
    
    config_items = [
        ("GOOGLE_CLIENT_ID", settings.GOOGLE_CLIENT_ID),
        ("GOOGLE_CLIENT_SECRET", settings.GOOGLE_CLIENT_SECRET),
        ("GOOGLE_REDIRECT_URI", settings.GOOGLE_REDIRECT_URI),
        ("GOOGLE_DRIVE_FOLDER_ID_EXCEL", settings.GOOGLE_DRIVE_FOLDER_ID_EXCEL),
        ("GOOGLE_DRIVE_FOLDER_ID_NOTICE_IMAGE", settings.GOOGLE_DRIVE_FOLDER_ID_NOTICE_IMAGE),
    ]
    
    all_configured = True
    for name, value in config_items:
        if value:
            logger.info(f"✅ {name}: {'*' * 10}...{value[-10:] if len(str(value)) > 10 else value}")
        else:
            logger.warning(f"❌ {name}: 설정되지 않음")
            all_configured = False
    
    return all_configured

def test_drive_service():
    """Google Drive 서비스 테스트"""
    try:
        logger.info("=== Google Drive 서비스 테스트 ===")
        
        from app.services.google_drive_service import google_drive_service
        
        logger.info("✅ Google Drive 서비스 인스턴스 생성 성공")
        
        # 폴더 내 파일 목록 조회 테스트 (엑셀 폴더)
        logger.info("엑셀 폴더 내 파일 목록 조회 테스트...")
        files = google_drive_service.list_files_in_folder(settings.GOOGLE_DRIVE_FOLDER_ID_EXCEL)
        logger.info(f"✅ 엑셀 폴더 내 파일 개수: {len(files)}")
        
        for file in files[:3]:  # 처음 3개 파일만 표시
            logger.info(f"  - {file['filename']} ({file['file_size']} bytes)")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Google Drive 서비스 테스트 실패: {str(e)}")
        return False

def test_database_connection():
    """데이터베이스 연결 테스트"""
    try:
        logger.info("=== 데이터베이스 연결 테스트 ===")
        
        from app.database import get_db
        from app.models import UploadedFile
        from sqlalchemy.orm import Session
        
        db = next(get_db())
        file_count = db.query(UploadedFile).count()
        logger.info(f"✅ 데이터베이스 연결 성공, 업로드 파일 개수: {file_count}")
        
        # 새로운 컬럼들이 제대로 추가되었는지 확인
        sample_file = db.query(UploadedFile).first()
        if sample_file:
            logger.info("✅ 업데이트된 모델 필드들:")
            logger.info(f"  - drive_file_id: {hasattr(sample_file, 'drive_file_id')}")
            logger.info(f"  - drive_web_view_link: {hasattr(sample_file, 'drive_web_view_link')}")
            logger.info(f"  - drive_download_link: {hasattr(sample_file, 'drive_download_link')}")
            logger.info(f"  - drive_created_time: {hasattr(sample_file, 'drive_created_time')}")
        
        db.close()
        return True
        
    except Exception as e:
        logger.error(f"❌ 데이터베이스 연결 테스트 실패: {str(e)}")
        return False

def main():
    """메인 테스트 함수"""
    logger.info("🚀 Google Drive 통합 시스템 테스트 시작")
    logger.info("=" * 50)
    
    tests = [
        ("설정 확인", test_config),
        ("데이터베이스 연결", test_database_connection),
        ("Google Drive 서비스", test_drive_service),
    ]
    
    results = []
    for test_name, test_func in tests:
        logger.info(f"\n📋 {test_name} 테스트 실행 중...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            logger.error(f"❌ {test_name} 테스트 중 예외 발생: {str(e)}")
            results.append((test_name, False))
    
    # 결과 요약
    logger.info("\n" + "=" * 50)
    logger.info("📊 테스트 결과 요약")
    logger.info("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ 통과" if result else "❌ 실패"
        logger.info(f"{test_name}: {status}")
        if result:
            passed += 1
    
    logger.info(f"\n총 {len(results)}개 테스트 중 {passed}개 통과")
    
    if passed == len(results):
        logger.info("🎉 모든 테스트가 통과했습니다!")
        logger.info("Google Drive 통합이 성공적으로 완료되었습니다.")
    else:
        logger.warning("⚠️  일부 테스트가 실패했습니다. 설정을 확인해주세요.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
