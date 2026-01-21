from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# DB URL (환경 변수에서 불러오기)
DATABASE_URL = settings.DATABASE_URL

# SQLAlchemy Engine 생성
engine = create_engine(DATABASE_URL, echo=True)

# SessionLocal: 요청마다 DB 세션 생성용
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스: 모든 ORM 모델이 상속
Base = declarative_base()

# FastAPI 의존성용
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()