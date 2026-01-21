#!/usr/bin/env python3
"""이메일 설정 확인 스크립트"""
import os
import sys

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

print("=" * 60)
print("이메일 설정 확인")
print("=" * 60)
print(f"MAIL_USERNAME: {settings.MAIL_USERNAME if settings.MAIL_USERNAME else '(설정되지 않음)'}")
print(f"MAIL_PASSWORD: {'***' if settings.MAIL_PASSWORD else '(설정되지 않음)'}")
print(f"MAIL_FROM: {settings.MAIL_FROM if settings.MAIL_FROM else '(설정되지 않음)'}")
print(f"MAIL_SERVER: {settings.MAIL_SERVER}")
print(f"MAIL_PORT: {settings.MAIL_PORT}")
print(f"MAIL_STARTTLS: {settings.MAIL_STARTTLS}")
print(f"MAIL_SSL_TLS: {settings.MAIL_SSL_TLS}")
print("=" * 60)

if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
    print("⚠️  경고: MAIL_USERNAME 또는 MAIL_PASSWORD가 설정되지 않았습니다.")
    print("   .env 파일에 다음 설정을 추가해주세요:")
    print("   MAIL_USERNAME=your-email@gmail.com")
    print("   MAIL_PASSWORD=your-app-password")
    print("   MAIL_SERVER=smtp.gmail.com")
    print("   MAIL_PORT=587")
    print("   MAIL_STARTTLS=True")
    print("   MAIL_SSL_TLS=False")
    sys.exit(1)
else:
    print("✅ 이메일 설정이 모두 완료되었습니다.")
    print(f"   발신자: {settings.MAIL_FROM or settings.MAIL_USERNAME}")
    print(f"   SMTP 서버: {settings.MAIL_SERVER}:{settings.MAIL_PORT}")












