# 스테이징 빌드 및 실행 방법

스테이징 환경(`.env.staging`)만 빌드하고 실행하는 방법을 정리합니다.

---

## 사전 요구사항

- Python 3.x + 가상환경 `.venv`
- Node.js (npm)
- PostgreSQL (DB `devhistory`, 사용자 `historydev`)

---

## 1. 프론트엔드 빌드 (환경별 출력 분리)

스테이징용과 프로덕션용 빌드 결과를 **서로 다른 폴더**에 넣어, 같은 서버에서 두 환경이 각각 다른 빌드를 서빙하도록 합니다.

**스테이징용 빌드** (develop 브랜치 등에서 사용):

```bash
cd frontend
npm install
npm run build:staging
```

- 빌드 결과물: `frontend/dist-staging/`
- 스테이징 백엔드(ENV_FILE=.env.staging)만 이 폴더를 서빙합니다.

**프로덕션용 빌드** (배포 시):

```bash
cd frontend
npm run build
```

- 빌드 결과물: `frontend/dist/`
- 프로덕션 백엔드(.env)만 이 폴더를 서빙합니다.

---

## 2. 백엔드 실행 (스테이징)

```bash
cd /home/grace/Projects/kmshistory/kmshistory-v2/backend

# 가상환경 활성화 후
source ../.venv/bin/activate

# 스테이징 환경 변수로 실행
ENV_FILE=.env.staging BACKEND_PORT=8016 uvicorn app.main:app --host 127.0.0.1 --port 8016
```

- `ENV_FILE=.env.staging` → `.env.staging` 설정 사용 (DB: devhistory, FRONTEND_URL: staging.kmshistory.kr 등)
- 포트 `8016` 사용 (프로덕션 8015와 구분)

---

## 3. 접속

- **서버 직접 접속**: `http://localhost:8016`  
  - 백엔드가 `frontend/dist-staging`을 서빙하므로 웹 UI 접속 가능
- **Nginx 리버스 프록시 사용 시**: `https://staging.kmshistory.kr` (443 → 8016)

---

## 4. systemd 서비스로 실행하는 경우

이미 등록된 서비스가 있다면:

```bash
sudo systemctl restart kmshistory-staging
```

재시작 후에는 `ENV_FILE=.env.staging`, `BACKEND_PORT=8016` 설정이 적용된 상태로 백엔드가 실행됩니다.

---

## 5. 한 번에 실행 (예시 스크립트)

```bash
# 스테이징용 프론트엔드 빌드 (dist-staging에 출력)
cd frontend
npm run build:staging

# 스테이징 백엔드 실행
cd ../backend
source ../.venv/bin/activate
ENV_FILE=.env.staging uvicorn app.main:app --host 127.0.0.1 --port 8016
```

---

## 환경별 요약

| 구분       | env 파일       | 프론트 빌드 결과      | DB         | 포트 |
|-----------|----------------|------------------------|-----------|------|
| 스테이징  | `.env.staging` | `frontend/dist-staging` | devhistory| 8016 |
| 프로덕션  | `.env`         | `frontend/dist`         | kmshistory| 8015 |

- develop 등에서 스테이징만 갱신할 때: `npm run build:staging`만 실행하면 프로덕션(`dist`)에는 영향 없음.
- 프로덕션 배포 시: `npm run build`로 `dist`를 갱신하고 프로덕션 백엔드만 재시작하면 됨.
