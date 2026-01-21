# 스테이징 환경 실행 가이드

## 개요
스테이징 환경은 개발 중인 코드를 바로바로 확인할 수 있도록 개발 서버를 사용합니다.

## 구조
- **백엔드**: 포트 8007 (FastAPI + uvicorn --reload)
- **프론트엔드**: 포트 3004 (Vite 개발 서버)

## 사용법

### SSH 접속 후 실행

```bash
# 프로젝트 루트로 이동
cd /home/svuser/kmshistory/kmshistory-v2

# 스테이징 환경 시작
./run-staging.sh

# 스테이징 환경 종료
./stop-staging.sh
```

### 개별 실행 (선택사항)

**백엔드만 실행:**
```bash
cd backend
./run-staging.sh
```

**프론트엔드만 실행:**
```bash
cd frontend
./run-staging.sh
```

## 로그 확인

```bash
# 백엔드 로그
tail -f logs/backend-staging.log

# 프론트엔드 로그
tail -f logs/frontend-staging.log

# 두 로그 동시 확인
tail -f logs/*-staging.log
```

## 접속 주소

- 백엔드 API: http://localhost:8007
- 프론트엔드: http://localhost:3004

## 프로덕션과의 차이

| 항목 | 스테이징 | 프로덕션 |
|------|---------|---------|
| 프론트엔드 | 개발 서버 (Vite) | 정적 빌드 파일 |
| 코드 변경 | 즉시 반영 | 빌드 필요 |
| 백엔드 포트 | 8007 | 8006 |
| 프론트엔드 포트 | 3004 | - (백엔드가 서빙) |

## 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# 포트 사용 확인
lsof -i :8007
lsof -i :3004

# 프로세스 강제 종료
kill -9 <PID>
```

### 로그 디렉토리 권한 문제
```bash
mkdir -p logs
chmod 755 logs
```

