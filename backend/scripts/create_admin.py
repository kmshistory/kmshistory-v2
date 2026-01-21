#!/usr/bin/env python3
"""
관리자 계정 생성 스크립트
초기 관리자 계정을 생성하거나 추가 관리자 계정을 생성합니다.
"""

import sys
import os
import getpass
import re

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.models import User
from app.utils.auth import get_password_hash
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def validate_email(email: str) -> bool:
    """이메일 형식 검증"""
    pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    return bool(re.match(pattern, email))


def validate_nickname(nickname: str) -> tuple[bool, str]:
    """닉네임 형식 검증"""
    if len(nickname) < 2 or len(nickname) > 15:
        return False, "닉네임은 2-15자 사이여야 합니다."
    if not re.match(r'^[가-힣a-zA-Z0-9]+$', nickname):
        return False, "닉네임은 한글, 영문, 숫자만 사용 가능합니다."
    return True, ""


def validate_password(password: str) -> tuple[bool, str]:
    """비밀번호 규칙 검증"""
    if len(password) < 6 or len(password) > 32:
        return False, "비밀번호는 6-32자 사이여야 합니다."
    
    # 영문 대문자, 소문자, 숫자, 특수문자 중 2가지 이상 포함
    patterns = [
        r'[A-Z]',  # 대문자
        r'[a-z]',  # 소문자
        r'[0-9]',  # 숫자
        r'[!@#$%^&*(),.?":{}|<>]'  # 특수문자
    ]
    
    match_count = sum(1 for pattern in patterns if re.search(pattern, password))
    if match_count < 2:
        return False, "비밀번호는 영문 대/소문자, 숫자, 특수문자 중 2가지 이상 포함해야 합니다."
    
    return True, ""


def check_existing_user(db: SessionLocal, email: str, nickname: str) -> tuple[bool, str]:
    """기존 사용자 확인"""
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        return True, f"이미 사용 중인 이메일입니다: {email}"
    
    existing_nickname = db.query(User).filter(User.nickname == nickname).first()
    if existing_nickname:
        return True, f"이미 사용 중인 닉네임입니다: {nickname}"
    
    return False, ""


def create_admin_user(
    email: str,
    nickname: str,
    password: str,
    is_email_verified: bool = True,
    db: SessionLocal = None
) -> dict:
    """관리자 계정 생성"""
    if db is None:
        db = SessionLocal()
    
    try:
        # 입력값 검증
        if not validate_email(email):
            return {"success": False, "message": "올바른 이메일 형식을 입력해주세요."}
        
        is_valid, error_msg = validate_nickname(nickname)
        if not is_valid:
            return {"success": False, "message": error_msg}
        
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return {"success": False, "message": error_msg}
        
        # 기존 사용자 확인
        exists, error_msg = check_existing_user(db, email, nickname)
        if exists:
            return {"success": False, "message": error_msg}
        
        # 비밀번호 해싱
        password_hash = get_password_hash(password)
        
        # 관리자 계정 생성
        admin_user = User(
            email=email.strip(),
            nickname=nickname.strip(),
            password_hash=password_hash,
            role="admin",
            is_active=True,
            is_email_verified=is_email_verified,
            agree_terms=True,
            agree_privacy=True,
            agree_collection=True,
            agree_marketing=True,
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        logger.info(f"✅ 관리자 계정이 성공적으로 생성되었습니다!")
        logger.info(f"   이메일: {admin_user.email}")
        logger.info(f"   닉네임: {admin_user.nickname}")
        logger.info(f"   사용자 ID: {admin_user.id}")
        
        return {
            "success": True,
            "message": "관리자 계정이 성공적으로 생성되었습니다.",
            "user_id": admin_user.id,
            "email": admin_user.email,
            "nickname": admin_user.nickname,
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ 관리자 계정 생성 중 오류 발생: {str(e)}")
        return {"success": False, "message": f"계정 생성 중 오류가 발생했습니다: {str(e)}"}
    finally:
        db.close()


def interactive_create():
    """대화형 관리자 계정 생성"""
    print("\n" + "=" * 60)
    print("관리자 계정 생성")
    print("=" * 60)
    print()
    
    # 이메일 입력
    while True:
        email = input("이메일을 입력하세요: ").strip()
        if not email:
            print("❌ 이메일은 필수입니다.")
            continue
        if not validate_email(email):
            print("❌ 올바른 이메일 형식을 입력해주세요.")
            continue
        break
    
    # 닉네임 입력
    while True:
        nickname = input("닉네임을 입력하세요 (2-15자, 한글/영문/숫자): ").strip()
        if not nickname:
            print("❌ 닉네임은 필수입니다.")
            continue
        is_valid, error_msg = validate_nickname(nickname)
        if not is_valid:
            print(f"❌ {error_msg}")
            continue
        break
    
    # 비밀번호 입력
    while True:
        password = getpass.getpass("비밀번호를 입력하세요 (6-32자, 2종류 이상): ")
        if not password:
            print("❌ 비밀번호는 필수입니다.")
            continue
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            print(f"❌ {error_msg}")
            continue
        
        # 비밀번호 확인
        password_confirm = getpass.getpass("비밀번호를 다시 입력하세요: ")
        if password != password_confirm:
            print("❌ 비밀번호가 일치하지 않습니다.")
            continue
        break
    
    # 이메일 인증 여부
    print("\n이메일 인증 상태 (기본값: True)")
    email_verified_input = input("이메일 인증 완료로 설정하시겠습니까? (Y/n): ").strip().lower()
    is_email_verified = email_verified_input != 'n'
    
    print("\n" + "-" * 60)
    print("입력 정보 확인:")
    print(f"  이메일: {email}")
    print(f"  닉네임: {nickname}")
    print(f"  비밀번호: {'*' * len(password)}")
    print(f"  이메일 인증: {is_email_verified}")
    print("-" * 60)
    
    confirm = input("\n위 정보로 관리자 계정을 생성하시겠습니까? (Y/n): ").strip().lower()
    if confirm == 'n':
        print("❌ 계정 생성을 취소했습니다.")
        return
    
    # 계정 생성
    result = create_admin_user(email, nickname, password, is_email_verified)
    
    if result["success"]:
        print(f"\n✅ {result['message']}")
        print(f"   사용자 ID: {result['user_id']}")
    else:
        print(f"\n❌ {result['message']}")


def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="관리자 계정 생성 스크립트",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  # 대화형 모드
  python create_admin.py
  
  # 명령줄 인자 모드
  python create_admin.py --email admin@example.com --nickname admin --password Admin123!
        """
    )
    
    parser.add_argument(
        "--email",
        type=str,
        help="관리자 이메일"
    )
    parser.add_argument(
        "--nickname",
        type=str,
        help="관리자 닉네임"
    )
    parser.add_argument(
        "--password",
        type=str,
        help="관리자 비밀번호 (보안상 권장하지 않음, 대화형 모드 사용 권장)"
    )
    parser.add_argument(
        "--email-verified",
        action="store_true",
        default=True,
        help="이메일 인증 완료로 설정 (기본값: True)"
    )
    
    args = parser.parse_args()
    
    # 명령줄 인자가 모두 제공된 경우
    if args.email and args.nickname and args.password:
        result = create_admin_user(
            args.email,
            args.nickname,
            args.password,
            args.email_verified
        )
        
        if result["success"]:
            print(f"✅ {result['message']}")
            sys.exit(0)
        else:
            print(f"❌ {result['message']}")
            sys.exit(1)
    # 대화형 모드
    else:
        interactive_create()


if __name__ == "__main__":
    main()

