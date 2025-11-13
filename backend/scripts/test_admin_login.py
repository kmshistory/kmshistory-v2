#!/usr/bin/env python3
"""
관리자 계정 로그인 테스트 스크립트
생성한 관리자 계정으로 로그인이 잘 되는지 확인합니다.
"""

import sys
import os
import requests
import json

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_login(email: str, password: str, base_url: str = "http://localhost:8006"):
    """로그인 테스트"""
    print("\n" + "=" * 60)
    print("관리자 계정 로그인 테스트")
    print("=" * 60)
    print(f"\n테스트 서버: {base_url}")
    print(f"이메일: {email}")
    print(f"비밀번호: {'*' * len(password)}")
    print("\n" + "-" * 60)
    
    # 로그인 요청
    login_url = f"{base_url}/api/auth/login"
    login_data = {
        "email": email,
        "password": password
    }
    
    try:
        print("로그인 요청 전송 중...")
        response = requests.post(
            login_url,
            json=login_data,
            headers={"Content-Type": "application/json"},
            allow_redirects=False
        )
        
        print(f"\n응답 상태 코드: {response.status_code}")
        
        # 쿠키 확인
        cookies = response.cookies
        has_access_token = "access_token" in cookies
        
        print(f"응답 쿠키: {dict(cookies)}")
        print(f"access_token 쿠키 존재: {has_access_token}")
        
        if response.status_code == 200:
            try:
                response_data = response.json()
                print(f"\n응답 데이터:")
                print(json.dumps(response_data, indent=2, ensure_ascii=False))
                
                user_data = response_data.get("user", {})
                user_role = user_data.get("role", "unknown")
                
                print("\n" + "-" * 60)
                if has_access_token:
                    print("✅ 로그인 성공! access_token 쿠키가 설정되었습니다.")
                    if user_role == "admin":
                        print("✅ 관리자 권한 확인됨!")
                    else:
                        print(f"⚠️  경고: 사용자 권한이 '{user_role}'입니다. (관리자가 아닙니다)")
                else:
                    print("⚠️  경고: 로그인은 성공했지만 access_token 쿠키가 없습니다.")
                
                # /api/auth/me 테스트
                print("\n" + "-" * 60)
                print("사용자 정보 확인 테스트 (/api/auth/me)...")
                
                me_url = f"{base_url}/api/auth/me"
                me_response = requests.get(
                    me_url,
                    cookies=cookies,
                    headers={"Content-Type": "application/json"}
                )
                
                print(f"응답 상태 코드: {me_response.status_code}")
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print(f"\n사용자 정보:")
                    print(json.dumps(me_data, indent=2, ensure_ascii=False))
                    if me_data.get("role") == "admin":
                        print("\n✅ 관리자 권한으로 인증 확인 완료!")
                        return True
                    else:
                        print(f"\n⚠️  경고: 사용자 권한이 '{me_data.get('role')}'입니다.")
                        return False
                else:
                    print(f"\n❌ 사용자 정보 조회 실패: {me_response.status_code}")
                    print(f"응답: {me_response.text}")
                    return False
                    
            except json.JSONDecodeError:
                print(f"\n❌ 응답이 JSON 형식이 아닙니다.")
                print(f"응답 내용: {response.text[:200]}")
                return False
        else:
            print(f"\n❌ 로그인 실패!")
            try:
                error_data = response.json()
                print(f"에러 메시지: {error_data.get('detail', '알 수 없는 오류')}")
            except:
                print(f"응답 내용: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ 연결 오류: 서버({base_url})에 연결할 수 없습니다.")
        print("서버가 실행 중인지 확인해주세요.")
        return False
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """메인 함수"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="관리자 계정 로그인 테스트 스크립트",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예제:
  # 기본 사용 (localhost:8006)
  python test_admin_login.py --email admin@example.com --password Admin123!
  
  # 다른 서버 테스트
  python test_admin_login.py --email admin@example.com --password Admin123! --url http://localhost:3004
        """
    )
    
    parser.add_argument(
        "--email",
        type=str,
        required=True,
        help="관리자 이메일"
    )
    parser.add_argument(
        "--password",
        type=str,
        required=True,
        help="관리자 비밀번호"
    )
    parser.add_argument(
        "--url",
        type=str,
        default="http://localhost:8006",
        help="테스트할 서버 URL (기본값: http://localhost:8006)"
    )
    
    args = parser.parse_args()
    
    success = test_login(args.email, args.password, args.url)
    
    print("\n" + "=" * 60)
    if success:
        print("✅ 테스트 완료: 관리자 계정으로 로그인 가능합니다!")
        print("\n이제 웹사이트에서 로그인하여 /admin 페이지에 접근할 수 있습니다.")
        sys.exit(0)
    else:
        print("❌ 테스트 실패: 로그인에 문제가 있습니다.")
        sys.exit(1)


if __name__ == "__main__":
    main()













