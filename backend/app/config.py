import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # 데이터베이스 설정 (PostgreSQL)
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://kms:720909@localhost:5432/kmshistory")
    
    # JWT 설정
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # 이메일 설정 (구글 SMTP)
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_FROM = os.getenv("MAIL_FROM")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
    MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"
    
    # 이메일 인증 설정
    EMAIL_VERIFICATION_CODE_LENGTH = int(os.getenv("EMAIL_VERIFICATION_CODE_LENGTH", "6"))
    EMAIL_VERIFICATION_EXPIRE_MINUTES = int(os.getenv("EMAIL_VERIFICATION_EXPIRE_MINUTES", "5"))
    
    # 프론트엔드 URL 설정
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Google Drive API 설정
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
    
    # Google Drive 폴더 ID (용도별 분리)
    GOOGLE_DRIVE_FOLDER_ID_EXCEL = os.getenv("GOOGLE_DRIVE_FOLDER_ID_EXCEL")
    GOOGLE_DRIVE_FOLDER_ID_NOTICE_IMAGE = os.getenv("GOOGLE_DRIVE_FOLDER_ID_NOTICE_IMAGE")
    
    # Google Calendar API 설정
    GOOGLE_CALENDAR_ID = os.getenv("GOOGLE_CALENDAR_ID")
    GOOGLE_HOLIDAY_CALENDAR_ID = os.getenv("GOOGLE_HOLIDAY_CALENDAR_ID", "ko.south_korea#holiday@group.v.calendar.google.com")
    
    # 서비스 계정 JSON (서버 환경에서 브라우저 없이 인증)
    GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")

settings = Settings()
