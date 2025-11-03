#!/bin/bash
# FastAPI 서버 실행 스크립트

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.." || exit 1

# 가상환경 활성화
source venv/bin/activate

# backend 디렉토리로 이동
cd backend || exit 1

# FastAPI 서버 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload



