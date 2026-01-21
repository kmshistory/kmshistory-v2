#!/usr/bin/env python3
"""
사용자 역할 변경 스크립트
기존 계정의 역할을 변경합니다.
"""

import sys
import os

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.models import User
from datetime import datetime
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def change_user_role(email: str, new_role: str = "admin", db=None):
    """사용자 역할 변경"""
    if db is None:
        db = SessionLocal()
    
    try:
        # 사용자 찾기
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            logger.error(f"❌ 이메일 '{email}'에 해당하는 사용자를 찾을 수 없습니다.")
            return {"success": False, "message": f"사용자를 찾을 수 없습니다: {email}"}
        
        # 역할 검증
        if new_role not in {"admin", "leader", "member"}:
            logger.error(f"❌ 유효하지 않은 역할입니다: {new_role}")
            return {"success": False, "message": f"유효하지 않은 역할입니다: {new_role}"}
        
        # 이미 해당 역할인지 확인
        if user.role == new_role:
            logger.info(f"ℹ️  사용자 '{email}'는 이미 '{new_role}' 역할입니다.")
            return {
                "success": True,
                "message": f"사용자는 이미 '{new_role}' 역할입니다.",
                "email": user.email,
                "nickname": user.nickname,
                "old_role": user.role,
                "new_role": new_role,
            }
        
        # 변경 전 상태 저장
        old_role = user.role
        
        # 역할 변경
        user.role = new_role
        user.updated_at = datetime.now()
        db.commit()
        db.refresh(user)
        
        logger.info(f"✅ 사용자 역할이 성공적으로 변경되었습니다!")
        logger.info(f"   이메일: {user.email}")
        logger.info(f"   닉네임: {user.nickname}")
        logger.info(f"   이전 역할: {old_role}")
        logger.info(f"   새 역할: {user.role}")
        
        return {
            "success": True,
            "message": f"사용자 역할이 '{old_role}'에서 '{new_role}'로 변경되었습니다.",
            "email": user.email,
            "nickname": user.nickname,
            "old_role": old_role,
            "new_role": user.role,
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 역할 변경 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": f"역할 변경 중 오류가 발생했습니다: {str(e)}"}
    finally:
        db.close()


def change_multiple_users(emails: list, new_role: str = "admin"):
    """여러 사용자의 역할을 한 번에 변경"""
    results = []
    for email in emails:
        logger.info(f"\n{'=' * 60}")
        logger.info(f"처리 중: {email}")
        logger.info(f"{'=' * 60}")
        result = change_user_role(email, new_role)
        results.append(result)
    
    # 결과 요약
    logger.info(f"\n{'=' * 60}")
    logger.info("처리 결과 요약")
    logger.info(f"{'=' * 60}")
    success_count = sum(1 for r in results if r["success"])
    total_count = len(results)
    logger.info(f"총 {total_count}개 계정 중 {success_count}개 성공")
    
    return results


def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="사용자 역할 변경 스크립트",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  # 단일 사용자 역할 변경
  python change_user_role.py --email user@example.com --role admin
  
  # 여러 사용자 역할 변경
  python change_user_role.py --emails user1@example.com user2@example.com --role admin
        """
    )
    
    parser.add_argument(
        "--email",
        type=str,
        help="역할을 변경할 사용자 이메일 (단일)"
    )
    parser.add_argument(
        "--emails",
        nargs="+",
        help="역할을 변경할 사용자 이메일 목록 (여러 개)"
    )
    parser.add_argument(
        "--role",
        type=str,
        default="admin",
        choices=["admin", "leader", "member"],
        help="변경할 역할 (기본값: admin)"
    )
    
    args = parser.parse_args()
    
    # 이메일 목록 구성
    emails = []
    if args.emails:
        emails = args.emails
    elif args.email:
        emails = [args.email]
    else:
        parser.print_help()
        sys.exit(1)
    
    # 역할 변경 실행
    if len(emails) == 1:
        result = change_user_role(emails[0], args.role)
        if result["success"]:
            print(f"\n✅ {result['message']}")
            sys.exit(0)
        else:
            print(f"\n❌ {result['message']}")
            sys.exit(1)
    else:
        results = change_multiple_users(emails, args.role)
        failed = [r for r in results if not r["success"]]
        if failed:
            print(f"\n❌ {len(failed)}개 계정 처리 실패")
            for f in failed:
                print(f"   - {f['message']}")
            sys.exit(1)
        else:
            print(f"\n✅ 모든 계정이 성공적으로 처리되었습니다!")
            sys.exit(0)


if __name__ == "__main__":
    main()

