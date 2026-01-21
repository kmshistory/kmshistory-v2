#!/bin/bash
# 스테이징 환경 종료 스크립트

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

echo "🛑 스테이징 환경 종료 중..."

# 백엔드 종료
if [ -f "$LOG_DIR/backend-staging.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend-staging.pid")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "🔧 백엔드 서버 종료 중... (PID: $BACKEND_PID)"
        kill "$BACKEND_PID"
        rm "$LOG_DIR/backend-staging.pid"
        echo "✅ 백엔드 서버 종료됨"
    else
        echo "⚠️  백엔드 서버가 실행 중이 아닙니다."
        rm "$LOG_DIR/backend-staging.pid"
    fi
else
    echo "⚠️  백엔드 PID 파일을 찾을 수 없습니다."
fi

# 프론트엔드 종료
if [ -f "$LOG_DIR/frontend-staging.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend-staging.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo "🎨 프론트엔드 서버 종료 중... (PID: $FRONTEND_PID)"
        kill "$FRONTEND_PID"
        rm "$LOG_DIR/frontend-staging.pid"
        echo "✅ 프론트엔드 서버 종료됨"
    else
        echo "⚠️  프론트엔드 서버가 실행 중이 아닙니다."
        rm "$LOG_DIR/frontend-staging.pid"
    fi
else
    echo "⚠️  프론트엔드 PID 파일을 찾을 수 없습니다."
fi

# 포트로도 확인하여 강제 종료
echo ""
echo "🔍 남아있는 프로세스 확인 중..."
pkill -f "uvicorn app.main:app.*8007" 2>/dev/null && echo "✅ 백엔드 프로세스 정리 완료"
pkill -f "vite.*3004" 2>/dev/null && echo "✅ 프론트엔드 프로세스 정리 완료"

echo ""
echo "✨ 스테이징 환경이 종료되었습니다."

