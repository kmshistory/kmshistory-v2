# 스테이징 빌드 및 실행 방법

스테이징 환경(`.env.staging`)만 빌드하고 실행하는 방법을 정리합니다.

---

## 사전 요구사항

- Python 3.x + 가상환경 `.venv`
- Node.js (npm)
- PostgreSQL (DB `devhistory`, 사용자 `historydev`)

---

## 1. 프론트엔드 빌드

```bash
cd /home/grace/Projects/kmshistory/kmshistory-v2/frontend
npm install
npm run build
```

빌드 결과물은 `frontend/dist/` 디렉토리에 생성됩니다.

---

## 2. 백엔드 실행 (스테이징)

```bash
cd /home/grace/Projects/kmshistory/kmshistory-v2/backend

# 가상환경 활성화 후
source ../.venv/bin/activate

# 스테이징 환경 변수로 실행
ENV_FILE=.env.staging BACKEND_PORT=8009 uvicorn app.main:app --host 127.0.0.1 --port 8009
```

- `ENV_FILE=.env.staging` → `.env.staging` 설정 사용 (DB: devhistory, FRONTEND_URL: staging.kmshistory.kr 등)
- 포트 `8009` 사용 (프로덕션 8006과 구분)

---

## 3. 접속

- **서버 직접 접속**: `http://localhost:8009`  
  - 백엔드가 `frontend/dist`를 서빙하므로 웹 UI 접속 가능
- **Nginx 리버스 프록시 사용 시**: `https://staging.kmshistory.kr` (443 → 8009)

---

## 4. systemd 서비스로 실행하는 경우

이미 등록된 서비스가 있다면:

```bash
sudo systemctl restart kmshistory-staging
```

재시작 후에는 `ENV_FILE=.env.staging`, `BACKEND_PORT=8009` 설정이 적용된 상태로 백엔드가 실행됩니다.

---

## 5. 한 번에 실행 (예시 스크립트)

```bash
# 프론트엔드 빌드
cd /home/grace/Projects/kmshistory/kmshistory-v2/frontend
npm run build

# 백엔드 실행
cd /home/grace/Projects/kmshistory/kmshistory-v2/backend
source ../.venv/bin/activate
ENV_FILE=.env.staging uvicorn app.main:app --host 127.0.0.1 --port 8009
```

---

## 환경별 요약

| 구분       | env 파일       | DB         | 포트 |
|-----------|----------------|-----------|------|
| 스테이징  | `.env.staging` | devhistory| 8009 |
| 프로덕션  | `.env`         | kmshistory| 8006 |
