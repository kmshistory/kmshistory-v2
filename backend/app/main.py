from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base

# FastAPI 앱 생성
app = FastAPI(
    title="KMS History Management System",
    description="강민성 한국사 관리 시스템 API",
    version="2.0.0"
)

# CORS 설정 (React 연동용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"message": "KMS History Management System API v2.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
