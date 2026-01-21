#!/usr/bin/env python3
"""
관리자 계정 확인 및 디버깅 스크립트
데이터베이스에 저장된 관리자 계정 정보를 확인하고 비밀번호 검증을 테스트합니다.
"""

import sys
import os
import getpass

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.models import User
from app.utils.auth import verify_password, get_password_hash
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_admin_accounts(email: str = None):
    """관리자 계정 정보 확인"""
    db = SessionLocal()
    try:
        print("\n" + "=" * 60)
        print("관리자 계정 정보 확인")
        print("=" * 60)
        
        if email:
            users = db.query(User).filter(User.email == email).all()
        else:
            users = db.query(User).filter(User.role == "admin").all()
        
        if not users:
            print("\n❌ 관리자 계정을 찾을 수 없습니다.")
            if email:
                print(f"   검색한 이메일: {email}")
            return None
        
        print(f"\n총 {len(users)}개의 관리자 계정을 찾았습니다:\n")
        
        for user in users:
            print("-" * 60)
            print(f"사용자 ID: {user.id}")
            print(f"이메일: {user.email}")
            print(f"닉네임: {user.nickname}")
            print(f"권한: {user.role}")
            print(f"활성 상태: {user.is_active}")
            print(f"이메일 인증: {user.is_email_verified}")
            print(f"차단 여부: {user.is_blocked}")
            print(f"비밀번호 해시 길이: {len(user.password_hash) if user.password_hash else 0}")
            print(f"비밀번호 해시 (처음 20자): {user.password_hash[:20] if user.password_hash else 'None'}...")
            print(f"생성일: {user.created_at}")
            print("-" * 60)
        
        return users[0] if users else None
        
    except Exception as e:
        logger.error(f"❌ 계정 확인 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()


def test_password_verification(email: str, password: str):
    """비밀번호 검증 테스트"""
    db = SessionLocal()
    try:
        print("\n" + "=" * 60)
        print("비밀번호 검증 테스트")
        print("=" * 60)
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"\n❌ 이메일 '{email}'에 해당하는 사용자를 찾을 수 없습니다.")
            return False
        
        print(f"\n사용자 정보:")
        print(f"  이메일: {user.email}")
        print(f"  닉네임: {user.nickname}")
        print(f"  권한: {user.role}")
        print(f"  활성 상태: {user.is_active}")
        print(f"  비밀번호 해시: {user.password_hash[:30]}...")
        
        # 비밀번호 검증
        print(f"\n비밀번호 검증 중...")
        print(f"  입력 비밀번호: {'*' * len(password)}")
        
        is_valid = verify_password(password, user.password_hash)
        
        if is_valid:
            print(f"\n✅ 비밀번호 검증 성공!")
            return True
        else:
            print(f"\n❌ 비밀번호 검증 실패!")
            print(f"\n디버깅 정보:")
            print(f"  비밀번호 해시 알고리즘: bcrypt")
            print(f"  해시 길이: {len(user.password_hash)}")
            
            # 새로운 해시 생성 테스트
            print(f"\n새로운 해시 생성 테스트...")
            new_hash = get_password_hash(password)
            print(f"  새 해시: {new_hash[:30]}...")
            print(f"  기존 해시와 비교: {new_hash == user.password_hash}")
            
            # 새 해시로 검증
            is_valid_new = verify_password(password, new_hash)
            print(f"  새 해시로 검증: {is_valid_new}")
            
            return False
            
    except Exception as e:
        logger.error(f"❌ 비밀번호 검증 테스트 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="관리자 계정 확인 및 디버깅 스크립트",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  # 모든 관리자 계정 확인
  python check_admin_account.py
  
  # 특정 이메일 계정 확인
  python check_admin_account.py --email admin@example.com
  
  # 비밀번호 검증 테스트
  python check_admin_account.py --email admin@example.com --test-password
        """
    )
    
    parser.add_argument(
        "--email",
        type=str,
        help="확인할 이메일 (없으면 모든 관리자 계정 표시)"
    )
    parser.add_argument(
        "--test-password",
        action="store_true",
        help="비밀번호 검증 테스트 실행"
    )
    
    args = parser.parse_args()
    
    # 계정 정보 확인
    user = check_admin_accounts(args.email)
    
    # 비밀번호 검증 테스트
    if args.test_password:
        if not args.email:
            print("\n❌ 비밀번호 검증 테스트를 위해서는 --email 옵션이 필요합니다.")
            sys.exit(1)
        
        password = getpass.getpass("\n비밀번호를 입력하세요: ")
        success = test_password_verification(args.email, password)
        
        if success:
            print("\n✅ 비밀번호가 정상적으로 작동합니다!")
            sys.exit(0)
        else:
            print("\n❌ 비밀번호 검증에 문제가 있습니다.")
            print("\n해결 방법:")
            print("1. 비밀번호가 정확한지 확인하세요.")
            print("2. 계정을 다시 생성하거나 비밀번호를 재설정하세요.")
            sys.exit(1)


if __name__ == "__main__":
    main()













