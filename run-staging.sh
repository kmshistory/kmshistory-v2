#!/bin/bash
# 스테이징 환경 통합 실행 스크립트 (백엔드 + 프론트엔드)

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# 로그 디렉토리 생성
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

echo " 스테이징 환경 시작 중..."
echo " 프로젝트 루트: $PROJECT_ROOT"
echo " 로그 디렉토리: $LOG_DIR"
echo ""

# 백엔드 실행 (백그라운드)
echo "🔧 백엔드 서버 시작 중... (포트 8007)"
cd "$PROJECT_ROOT" || exit 1
source .venv/bin/activate
cd backend || exit 1
nohup uvicorn app.main:app --host 0.0.0.0 --port 8007 --reload > "$LOG_DIR/backend-staging.log" 2>&1 &
BACKEND_PID=$!
echo "✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID)"
echo "📝 로그: $LOG_DIR/backend-staging.log"
echo ""

# 잠시 대기 (백엔드가 완전히 시작될 때까지)
sleep 2

# 프론트엔드 실행 (백그라운드)
echo "🎨 프론트엔드 개발 서버 시작 중... (포트 3004)"
cd "$PROJECT_ROOT/frontend" || exit 1
BACKEND_PORT=8007 nohup npm run dev > "$LOG_DIR/frontend-staging.log" 2>&1 &
FRONTEND_PID=$!
echo "✅ 프론트엔드 서버 시작됨 (PID: $FRONTEND_PID)"
echo "📝 로그: $LOG_DIR/frontend-staging.log"
echo ""

# PID 파일 저장
echo "$BACKEND_PID" > "$LOG_DIR/backend-staging.pid"
echo "$FRONTEND_PID" > "$LOG_DIR/frontend-staging.pid"

echo "=" 
echo "✨ 스테이징 환경이 시작되었습니다!"
echo ""
echo "📍 백엔드: http://localhost:8007"
echo "📍 프론트엔드: http://localhost:3004"
echo ""
echo "🛑 종료하려면: ./stop-staging.sh"
echo "📊 로그 확인: tail -f logs/backend-staging.log 또는 logs/frontend-staging.log"
echo ""

