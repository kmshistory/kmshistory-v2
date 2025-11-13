from pydantic_settings import BaseSettings
import os

# .env 파일 경로 명시적으로 지정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ENV_FILE 환경 변수로 파일 선택 (.env 또는 .env.staging)
_env_file_name = os.getenv("ENV_FILE", ".env")
ENV_FILE_PATH = os.path.join(BASE_DIR, _env_file_name)

class Settings(BaseSettings):
    PROJECT_NAME: str = "KMS History Renewal"
    
    # 데이터베이스 설정
    DB_USER: str = "devuser"
    DB_PASSWORD: str = "976431"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "kmshistory"
    
    # 기존 DATABASE_URL (호환성을 위해 유지)
    DATABASE_URL: str = "postgresql+psycopg2://devuser:976431@localhost:5432/kmshistory"
    
    FRONTEND_URL: str = "http://localhost:3004"
    
    # JWT 인증 설정
    SECRET_KEY: str = "your-secret-key-change-this-in-production"  # 프로덕션에서는 반드시 변경!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24시간 (1440분)
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 60 * 24  # 임시 사용자 토큰 만료 시간 (기본 24시간)
    TEMP_USER_CLEANUP_INTERVAL_SECONDS: int = 60 * 60  # 만료된 임시 사용자 정리 주기 (기본 1시간)
    
    # DB 자동 마이그레이션 설정
    # none: 마이그레이션 없음 (프로덕션)
    # validate: 테이블 존재만 확인
    # update: 누락된 컬럼만 추가 (권장)
    # create: 테이블 없으면 생성
    # create-drop: 시작 시 drop_all 후 create_all (개발용, 데이터 삭제됨!)
    DB_AUTO_MIGRATE: str = "update"
    
    # 이메일 설정 (SMTP)
    MAIL_USERNAME: str = ""  # 이메일 주소 또는 사용자명
    MAIL_PASSWORD: str = ""  # 이메일 비밀번호 또는 앱 비밀번호
    MAIL_FROM: str = ""  # 발신자 이메일 (기본값: MAIL_USERNAME)
    MAIL_SERVER: str = "smtp.gmail.com"  # SMTP 서버 주소
    MAIL_PORT: int = 587  # SMTP 포트 (587: STARTTLS, 465: SSL/TLS)
    MAIL_STARTTLS: bool = True  # STARTTLS 사용 여부
    MAIL_SSL_TLS: bool = False  # SSL/TLS 사용 여부 (MAIL_PORT가 465일 때 True)
    
    # 환경 설정
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # Google API 설정
    GOOGLE_CLIENT_ID: str = ""  # Google OAuth Client ID
    GOOGLE_CLIENT_SECRET: str = ""  # Google OAuth Client Secret
    GOOGLE_REDIRECT_URI: str = ""  # Google OAuth Redirect URI
    GOOGLE_CALENDAR_ID: str = ""  # Google Calendar ID (예: calendar-id@group.calendar.google.com)
    GOOGLE_TOKEN_REDIRECT_URI: str | None = None  # 토큰 발급 전용 Redirect URI
    GOOGLE_TOKEN_FILE: str = os.path.join(BASE_DIR, "token.json")  # Google OAuth 토큰 저장 경로
    GOOGLE_DRIVE_FOLDER_ID_EXCEL: str | None = None  # 대상자 엑셀 업로드용 Google Drive 폴더
    GOOGLE_DRIVE_FOLDER_ID_NOTICE_IMAGE: str | None = None  # 공지 이미지 업로드용 Google Drive 폴더
    GOOGLE_DRIVE_FOLDER_ID_QUIZ_IMAGE: str | None = None  # 퀴즈 이미지 업로드용 Google Drive 폴더
    
    # 미디어/업로드 설정
    MEDIA_URL: str = "/uploads"
    MEDIA_ROOT: str = os.path.join(BASE_DIR, "uploads")
    QUIZ_IMAGE_UPLOAD_SUBDIR: str = "quiz-images"
    MAX_QUIZ_IMAGE_SIZE_MB: int = 5

    class Config:
        env_file = ENV_FILE_PATH if os.path.exists(ENV_FILE_PATH) else os.path.join(BASE_DIR, ".env")
        env_file_encoding = "utf-8"
        case_sensitive = False  # 환경변수 대소문자 구분 안 함
        extra = "allow"  # .env 파일의 추가 필드 허용 (Google 설정 등)

# 전역 인스턴스
settings = Settings()