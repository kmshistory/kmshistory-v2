from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KMS History Renewal"
    
    # 데이터베이스 설정
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "976431"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"
    DB_NAME: str = "kmshistory"
    
    # 기존 DATABASE_URL (호환성을 위해 유지)
    DATABASE_URL: str = "postgresql+psycopg2://postgres:976431@localhost:5432/kmshistory"
    
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"  # .env 파일 자동 로드

# 전역 인스턴스
settings = Settings()