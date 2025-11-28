#!/bin/bash
# FastAPI 서버 실행 스크립트 (스테이징 서버 - 8007 포트)

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.." || exit 1

# 가상환경 활성화
source .venv/bin/activate

# backend 디렉토리로 이동
cd backend || exit 1

# FastAPI 서버 실행 (8007 포트, .env.staging 사용)
ENV_FILE=.env.staging uvicorn app.main:app --host 0.0.0.0 --port 8007 --reload

