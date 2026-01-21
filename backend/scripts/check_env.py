#!/usr/bin/env python3
"""현재 사용 중인 .env 파일 확인 스크립트"""
import os
import sys

# 현재 스크립트의 디렉토리 (backend/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# 프로젝트 루트 디렉토리 (backend/ -> 프로젝트 루트)
BASE_DIR = os.path.dirname(SCRIPT_DIR)

# ENV_FILE 환경 변수 확인
env_file_name = os.getenv("ENV_FILE", ".env")
env_file_path = os.path.join(BASE_DIR, env_file_name)

print("=" * 60)
print("📋 .env 파일 사용 현황 확인")
print("=" * 60)
print(f"환경 변수 ENV_FILE: {env_file_name if os.getenv('ENV_FILE') else '(설정되지 않음, 기본값 .env 사용)'}")
print(f"선택된 파일 경로: {env_file_path}")
print(f"파일 존재 여부: {'✅ 존재' if os.path.exists(env_file_path) else '❌ 없음'}")

# 실제 사용될 파일 (config.py 로직과 동일)
actual_file = env_file_path if os.path.exists(env_file_path) else os.path.join(BASE_DIR, ".env")
print(f"실제 사용될 파일: {actual_file}")
print(f"실제 파일 존재 여부: {'✅ 존재' if os.path.exists(actual_file) else '❌ 없음'}")

# Settings 인스턴스로 확인
try:
    # backend 디렉토리를 Python 경로에 추가
    sys.path.insert(0, SCRIPT_DIR)
    from app.config import settings, ENV_FILE_PATH
    
    print("\n" + "=" * 60)
    print("📦 Settings 인스턴스 정보")
    print("=" * 60)
    print(f"ENV_FILE_PATH: {ENV_FILE_PATH}")
    print(f"ENVIRONMENT: {settings.ENVIRONMENT}")
    print(f"DB_HOST: {settings.DB_HOST}")
    print(f"DB_PORT: {settings.DB_PORT}")
    print(f"FRONTEND_URL: {settings.FRONTEND_URL}")
except ImportError as e:
    print(f"\n⚠️  Settings 로드 중 오류: {e}")
    print("   (가상환경이 활성화되지 않았습니다. Settings 정보는 확인할 수 없지만,")
    print("    위의 환경 변수와 파일 경로 정보는 정확합니다.)")
except Exception as e:
    print(f"\n⚠️  Settings 로드 중 오류: {e}")

print("\n" + "=" * 60)

